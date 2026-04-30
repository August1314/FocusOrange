const { spawn } = require('child_process');
const fs = require('fs');

const CURL_CANDIDATES = [
  '/usr/bin/curl',
  '/opt/homebrew/bin/curl',
  '/usr/local/bin/curl',
  'curl',
];

function resolveCommand(candidates) {
  for (const candidate of candidates) {
    if (candidate.includes('/') && fs.existsSync(candidate)) {
      return candidate;
    }

    if (!candidate.includes('/')) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1];
}

function postJson(url, token, body, timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(resolveCommand(CURL_CANDIDATES), [
      '--fail',
      '--show-error',
      '--silent',
      '--max-time',
      String(Math.ceil(timeoutMs / 1000)),
      '-X',
      'POST',
      url,
      '-H',
      `Authorization: Bearer ${token}`,
      '-H',
      'Content-Type: application/json',
      '--data',
      JSON.stringify(body || {}),
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const timerId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill('SIGTERM');
      reject(new Error('cloud_queue_request_timeout'));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timerId);
      reject(error);
    });
    child.on('exit', (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timerId);

      if (code !== 0) {
        reject(new Error(`cloud_queue_request_failed_${code}: ${stderr || stdout}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function normalizeDeletionIds(deletions) {
  return deletions
    .map((deletion) => (typeof deletion === 'string' ? deletion : deletion && deletion.id))
    .filter((id) => typeof id === 'string' && id.length > 0);
}

async function publishSnapshot(routerUrl, token, storage) {
  const [records, deletions] = await Promise.all([
    storage.listRecords(),
    storage.listDeletions(),
  ]);

  await postJson(`${routerUrl}/api/snapshot`, token, {
    records,
    deletedIds: deletions.map((deletion) => deletion.id).filter(Boolean),
  });
}

function createCloudQueueSyncClient(storage, options = {}) {
  const routerUrl = (options.routerUrl || process.env.FOCUSORANGE_ROUTER_URL || '').replace(/\/+$/, '');
  const token = options.token || process.env.FOCUSORANGE_MAC_SYNC_TOKEN || '';
  const intervalMs = Number(options.intervalMs || process.env.FOCUSORANGE_CLOUD_QUEUE_INTERVAL_MS || 10_000);
  const enabled = routerUrl.length > 0 && token.length > 0;
  let timer = null;
  let running = false;

  async function syncOnce() {
    if (!enabled || running) {
      return;
    }

    running = true;

    try {
      const payload = await postJson(`${routerUrl}/api/queue/pull`, token, {});
      const records = Array.isArray(payload.records) ? payload.records : [];
      const deletions = Array.isArray(payload.deletedIds) ? payload.deletedIds : [];
      const deletedIds = normalizeDeletionIds(deletions);

      if (records.length === 0 && deletedIds.length === 0) {
        await publishSnapshot(routerUrl, token, storage);
        return;
      }

      const result = await storage.mergeRecords(records, deletions);
      await postJson(`${routerUrl}/api/queue/ack`, token, {
        recordIds: records.map((record) => record.id).filter(Boolean),
        deletedIds,
      });

      if ((result.acceptedIds.length > 0 || deletedIds.length > 0) && typeof options.onRecordsChanged === 'function') {
        options.onRecordsChanged();
      }

      await publishSnapshot(routerUrl, token, storage);

      console.log(`FocusOrange cloud queue synced records=${records.length} deletions=${deletedIds.length}`);
    } catch (error) {
      console.error('FocusOrange cloud queue sync failed', error);
    } finally {
      running = false;
    }
  }

  function start() {
    if (!enabled || timer) {
      return;
    }

    timer = setInterval(() => {
      void syncOnce();
    }, intervalMs);
    void syncOnce();
  }

  function stop() {
    if (!timer) {
      return;
    }

    clearInterval(timer);
    timer = null;
  }

  return {
    enabled,
    start,
    stop,
    syncOnce,
  };
}

module.exports = {
  createCloudQueueSyncClient,
};

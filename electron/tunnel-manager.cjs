const { spawn } = require('child_process');
const fs = require('fs');

const CLOUDFLARED_CANDIDATES = [
  '/opt/homebrew/bin/cloudflared',
  '/usr/local/bin/cloudflared',
  'cloudflared',
];

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

function findTunnelUrl(text) {
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  return match ? match[0].replace(/\/+$/, '') : null;
}

function fetchMetricsText(port) {
  return new Promise((resolve) => {
    const child = spawn(resolveCommand(CURL_CANDIDATES), [
      '--silent',
      '--max-time',
      '2',
      `http://127.0.0.1:${port}/metrics`,
    ], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let stdout = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.on('error', () => resolve(''));
    child.on('exit', () => resolve(stdout));
  });
}

async function registerTunnelUrl(tunnelUrl, options = {}) {
  const routerUrl = (options.routerUrl || process.env.FOCUSORANGE_ROUTER_URL || '').replace(/\/+$/, '');
  const adminToken = options.adminToken || process.env.FOCUSORANGE_ROUTER_ADMIN_TOKEN || '';
  const timeoutMs = Number(options.registerTimeoutMs || 15_000);

  if (!routerUrl || !adminToken) {
    return { ok: false, skipped: true, reason: 'missing_router_config' };
  }

  return new Promise((resolve, reject) => {
    const child = spawn(resolveCommand(CURL_CANDIDATES), [
      '--fail',
      '--show-error',
      '--silent',
      '--max-time',
      String(Math.ceil(timeoutMs / 1000)),
      '-X',
      'POST',
      `${routerUrl}/router/register`,
      '-H',
      `Authorization: Bearer ${adminToken}`,
      '-H',
      'Content-Type: application/json',
      '--data',
      JSON.stringify({ tunnelUrl }),
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
      reject(new Error('register_tunnel_timeout'));
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
        reject(new Error(`register_tunnel_failed_${code}: ${stderr || stdout}`));
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

function createQuickTunnelManager(options = {}) {
  const enabled = String(options.enabled || process.env.FOCUSORANGE_QUICK_TUNNEL || '').toLowerCase() === 'true';
  const host = options.host || process.env.FOCUSORANGE_SYNC_HOST || '127.0.0.1';
  const port = Number(options.port || process.env.FOCUSORANGE_SYNC_PORT || 33687);
  let child = null;
  let currentTunnelUrl = null;
  let pendingTunnelUrl = null;
  let registering = false;
  let outputBuffer = '';
  let retryTimer = null;
  let metricsProbeTimer = null;

  function scheduleRegister(tunnelUrl, delayMs = 0) {
    if (!tunnelUrl || tunnelUrl === currentTunnelUrl || registering) {
      return;
    }

    pendingTunnelUrl = tunnelUrl;
    if (retryTimer) {
      return;
    }

    retryTimer = setTimeout(() => {
      retryTimer = null;
      void registerPendingTunnel();
    }, delayMs);
  }

  async function registerPendingTunnel() {
    if (!pendingTunnelUrl || pendingTunnelUrl === currentTunnelUrl || registering) {
      return;
    }

    const tunnelUrl = pendingTunnelUrl;
    registering = true;

    try {
      await registerTunnelUrl(tunnelUrl, options);
      currentTunnelUrl = tunnelUrl;
      console.log(`FocusOrange quick tunnel registered: ${tunnelUrl}`);
    } catch (error) {
      console.error('FocusOrange quick tunnel registration failed', error);
    } finally {
      registering = false;
      if (currentTunnelUrl !== tunnelUrl) {
        scheduleRegister(tunnelUrl, 5_000);
      }
    }
  }

  async function handleOutput(chunk) {
    const text = chunk.toString();
    process.stdout.write(text);

    outputBuffer = `${outputBuffer}${text}`.slice(-4_000);
    const tunnelUrl = findTunnelUrl(outputBuffer);
    scheduleRegister(tunnelUrl);
  }

  async function probeMetricsForTunnelUrl() {
    if (!child || currentTunnelUrl) {
      return;
    }

    for (let metricsPort = 20241; metricsPort <= 20250; metricsPort += 1) {
      const metricsText = await fetchMetricsText(metricsPort);
      const tunnelUrl = findTunnelUrl(metricsText);
      if (tunnelUrl) {
        scheduleRegister(tunnelUrl);
        return;
      }
    }
  }

  function start() {
    if (!enabled || child) {
      return null;
    }

    child = spawn(resolveCommand(CLOUDFLARED_CANDIDATES), ['tunnel', '--url', `http://${host}:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
      void handleOutput(chunk);
    });
    child.stderr.on('data', (chunk) => {
      void handleOutput(chunk);
    });
    metricsProbeTimer = setInterval(() => {
      void probeMetricsForTunnelUrl();
    }, 5_000);
    child.on('exit', (code, signal) => {
      console.log(`FocusOrange quick tunnel exited code=${code} signal=${signal}`);
      child = null;
      pendingTunnelUrl = null;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (metricsProbeTimer) {
        clearInterval(metricsProbeTimer);
        metricsProbeTimer = null;
      }
    });
    child.on('error', (error) => {
      console.error('FocusOrange quick tunnel failed to start', error);
      child = null;
    });

    return child;
  }

  function stop() {
    if (!child) {
      return;
    }

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (metricsProbeTimer) {
      clearInterval(metricsProbeTimer);
      metricsProbeTimer = null;
    }
    child.kill('SIGTERM');
    child = null;
  }

  return {
    enabled,
    start,
    stop,
    getCurrentTunnelUrl: () => currentTunnelUrl,
  };
}

module.exports = {
  createQuickTunnelManager,
  findTunnelUrl,
  registerTunnelUrl,
};

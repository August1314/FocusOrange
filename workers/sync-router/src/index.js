const TUNNEL_URL_KEY = 'currentTunnelUrl';
const SNAPSHOT_KEY = 'snapshot';
const QUEUE_RECORD_PREFIX = 'queue:record:';
const QUEUE_DELETE_PREFIX = 'queue:delete:';
const ACK_DELETE_PREFIX = 'ack:delete:';
const ACK_TTL_SECONDS = 60 * 60 * 24 * 30;
const ALLOWED_ORIGIN = 'https://focusorange.pages.dev';
const ALLOWED_HEADERS = 'authorization, content-type';
const ALLOWED_METHODS = 'GET, POST, OPTIONS';

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function withCors(response, request) {
  const origin = request.headers.get('origin');
  if (origin !== ALLOWED_ORIGIN) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  headers.set('Vary', 'Origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || '';
  const prefix = 'Bearer ';
  return authorization.startsWith(prefix) ? authorization.slice(prefix.length) : '';
}

function isValidRecord(record) {
  return record
    && typeof record === 'object'
    && typeof record.id === 'string'
    && record.id.length > 0
    && typeof record.startTime === 'string'
    && typeof record.endTime === 'string'
    && typeof record.actualDuration === 'number'
    && record.actualDuration > 0
    && record.status === 'completed'
    && record.mode === 'work';
}

function normalizeDeletion(value) {
  if (typeof value === 'string' && value.length > 0) {
    return { id: value, deletedAt: new Date().toISOString() };
  }

  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || value.id.length === 0) {
    return null;
  }

  return {
    id: value.id,
    deletedAt: typeof value.deletedAt === 'string' ? value.deletedAt : new Date().toISOString(),
  };
}

function assertValidTunnelUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.trycloudflare.com')) {
    throw new Error('invalid_tunnel_url');
  }
}

async function listJsonValues(kv, prefix) {
  const values = [];
  let cursor;

  do {
    const result = await kv.list({ prefix, cursor });
    cursor = result.list_complete ? undefined : result.cursor;

    for (const key of result.keys) {
      const value = await kv.get(key.name, 'json');
      if (value) {
        values.push(value);
      }
    }
  } while (cursor);

  return values;
}

async function handleRegister(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  if (getBearerToken(request) !== env.FOCUSORANGE_ROUTER_ADMIN_TOKEN) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tunnelUrl = typeof body?.tunnelUrl === 'string' ? body.tunnelUrl.trim().replace(/\/+$/, '') : '';

  try {
    assertValidTunnelUrl(tunnelUrl);
  } catch (_error) {
    return json({ error: 'invalid_tunnel_url' }, { status: 400 });
  }

  await env.FOCUSORANGE_SYNC.put(TUNNEL_URL_KEY, tunnelUrl);
  return json({ ok: true, tunnelUrl });
}

async function handleStatus(env) {
  const tunnelUrl = await env.FOCUSORANGE_SYNC.get(TUNNEL_URL_KEY);
  return json({
    ok: true,
    configured: Boolean(tunnelUrl),
  });
}

async function proxyToTunnel(request, env) {
  if (getBearerToken(request) !== env.FOCUSORANGE_ROUTER_CLIENT_TOKEN) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const tunnelUrl = await env.FOCUSORANGE_SYNC.get(TUNNEL_URL_KEY);
  if (!tunnelUrl) {
    return json({ error: 'tunnel_not_configured' }, { status: 503 });
  }

  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(sourceUrl.pathname + sourceUrl.search, tunnelUrl);
  const headers = new Headers(request.headers);
  headers.set('authorization', `Bearer ${env.FOCUSORANGE_MAC_SYNC_TOKEN}`);
  headers.delete('host');

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  });
}

async function handleClientPush(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  if (getBearerToken(request) !== env.FOCUSORANGE_ROUTER_CLIENT_TOKEN) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const incomingRecords = Array.isArray(body.records) ? body.records : [];
  const incomingDeletions = Array.isArray(body.deletedIds) ? body.deletedIds.map(normalizeDeletion).filter(Boolean) : [];
  const validRecords = incomingRecords.filter(isValidRecord);
  const rejectedIds = incomingRecords
    .filter((record) => !isValidRecord(record))
    .map((record) => (record && record.id) || null);

  await Promise.all(validRecords.map((record) => (
    env.FOCUSORANGE_SYNC.put(`${QUEUE_RECORD_PREFIX}${record.id}`, JSON.stringify(record))
  )));

  const queuedDeletions = [];
  for (const deletion of incomingDeletions) {
    const acked = await env.FOCUSORANGE_SYNC.get(`${ACK_DELETE_PREFIX}${deletion.id}`);
    if (acked) {
      continue;
    }

    queuedDeletions.push(deletion);
    await env.FOCUSORANGE_SYNC.put(`${QUEUE_DELETE_PREFIX}${deletion.id}`, JSON.stringify(deletion));
  }

  const snapshot = await env.FOCUSORANGE_SYNC.get(SNAPSHOT_KEY, 'json');

  return json({
    acceptedIds: validRecords.map((record) => record.id),
    duplicateIds: [],
    rejectedIds,
    deletedIds: Array.from(new Set([
      ...incomingDeletions.map((deletion) => deletion.id),
      ...((snapshot && Array.isArray(snapshot.deletedIds)) ? snapshot.deletedIds : []),
    ])),
    queued: {
      records: validRecords.length,
      deletions: queuedDeletions.length,
    },
    records: snapshot && Array.isArray(snapshot.records) ? snapshot.records : [],
  });
}

async function handleQueuePull(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  if (getBearerToken(request) !== env.FOCUSORANGE_MAC_SYNC_TOKEN) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const [records, deletions] = await Promise.all([
    listJsonValues(env.FOCUSORANGE_SYNC, QUEUE_RECORD_PREFIX),
    listJsonValues(env.FOCUSORANGE_SYNC, QUEUE_DELETE_PREFIX),
  ]);

  return json({
    records,
    deletedIds: deletions,
  });
}

async function handleQueueAck(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  if (getBearerToken(request) !== env.FOCUSORANGE_MAC_SYNC_TOKEN) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const recordIds = Array.isArray(body.recordIds) ? body.recordIds.filter((id) => typeof id === 'string' && id.length > 0) : [];
  const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds.filter((id) => typeof id === 'string' && id.length > 0) : [];

  await Promise.all([
    ...recordIds.map((id) => env.FOCUSORANGE_SYNC.delete(`${QUEUE_RECORD_PREFIX}${id}`)),
    ...deletedIds.map((id) => env.FOCUSORANGE_SYNC.delete(`${QUEUE_DELETE_PREFIX}${id}`)),
    ...deletedIds.map((id) => env.FOCUSORANGE_SYNC.put(`${ACK_DELETE_PREFIX}${id}`, '1', {
      expirationTtl: ACK_TTL_SECONDS,
    })),
  ]);

  return json({
    ok: true,
    acked: {
      records: recordIds.length,
      deletions: deletedIds.length,
    },
  });
}

async function handleSnapshotPut(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, { status: 405 });
  }

  if (getBearerToken(request) !== env.FOCUSORANGE_MAC_SYNC_TOKEN) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const records = Array.isArray(body.records) ? body.records.filter(isValidRecord) : [];
  const deletedIds = Array.isArray(body.deletedIds)
    ? body.deletedIds.map((deletion) => (typeof deletion === 'string' ? deletion : deletion && deletion.id))
      .filter((id) => typeof id === 'string' && id.length > 0)
    : [];

  await env.FOCUSORANGE_SYNC.put(SNAPSHOT_KEY, JSON.stringify({
    records,
    deletedIds,
    updatedAt: new Date().toISOString(),
  }));

  return json({
    ok: true,
    records: records.length,
    deletedIds: deletedIds.length,
  });
}

function handleQueueHealth(request, env) {
  const token = getBearerToken(request);
  if (token !== env.FOCUSORANGE_ROUTER_CLIENT_TOKEN && token !== env.FOCUSORANGE_MAC_SYNC_TOKEN) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  return json({
    ok: true,
    mode: 'queue',
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }), request);
    }

    const url = new URL(request.url);
    let response;

    if (url.pathname === '/router/register') {
      response = await handleRegister(request, env);
    } else if (url.pathname === '/router/status') {
      response = await handleStatus(env);
    } else if (url.pathname === '/api/health') {
      response = handleQueueHealth(request, env);
    } else if (url.pathname === '/api/sync/push') {
      response = await handleClientPush(request, env);
    } else if (url.pathname === '/api/queue/pull') {
      response = await handleQueuePull(request, env);
    } else if (url.pathname === '/api/queue/ack') {
      response = await handleQueueAck(request, env);
    } else if (url.pathname === '/api/snapshot') {
      response = await handleSnapshotPut(request, env);
    } else if (url.pathname.startsWith('/api/')) {
      response = await proxyToTunnel(request, env);
    } else {
      response = json({ error: 'not_found' }, { status: 404 });
    }

    return withCors(response, request);
  },
};

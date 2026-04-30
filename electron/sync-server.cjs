const express = require('express');

const DEFAULT_SYNC_PORT = 33687;
const DEFAULT_SYNC_HOST = '127.0.0.1';
const DEFAULT_ALLOWED_HEADERS = 'authorization, content-type';
const DEFAULT_ALLOWED_METHODS = 'GET, POST, OPTIONS';

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function applyCorsHeaders(req, res, allowedOrigins) {
  const origin = req.get('origin');
  if (!origin || !allowedOrigins.includes(origin)) {
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS);
  res.setHeader('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
  res.setHeader('Vary', 'Origin');
  return true;
}

function isValidRecord(record) {
  if (!record || typeof record !== 'object') {
    return false;
  }

  if (typeof record.id !== 'string' || record.id.length === 0) {
    return false;
  }

  if (typeof record.startTime !== 'string' || Number.isNaN(Date.parse(record.startTime))) {
    return false;
  }

  if (typeof record.endTime !== 'string' || Number.isNaN(Date.parse(record.endTime))) {
    return false;
  }

  if (typeof record.actualDuration !== 'number' || record.actualDuration <= 0) {
    return false;
  }

  return record.status === 'completed' && record.mode === 'work';
}

function parseDeletion(value) {
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

function createSyncServer(storage, options = {}) {
  const app = express();
  const host = options.host || process.env.FOCUSORANGE_SYNC_HOST || DEFAULT_SYNC_HOST;
  const port = Number(options.port || process.env.FOCUSORANGE_SYNC_PORT || DEFAULT_SYNC_PORT);
  const token = options.token || process.env.FOCUSORANGE_SYNC_TOKEN || '';
  const enabled = token.length > 0;
  const allowedOrigins = options.allowedOrigins || parseAllowedOrigins(process.env.FOCUSORANGE_SYNC_ALLOWED_ORIGIN);

  app.use((req, res, next) => {
    const originAllowed = applyCorsHeaders(req, res, allowedOrigins);
    if (req.method === 'OPTIONS') {
      res.status(originAllowed ? 204 : 403).end();
      return;
    }

    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      syncEnabled: enabled,
    });
  });

  app.use((req, res, next) => {
    if (!enabled) {
      res.status(503).json({ error: 'sync_disabled' });
      return;
    }

    const authorization = req.get('authorization') || '';
    if (authorization !== `Bearer ${token}`) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    next();
  });

  app.get('/api/records', async (_req, res, next) => {
    try {
      const [records, deletions] = await Promise.all([
        storage.listRecords(),
        storage.listDeletions(),
      ]);
      res.json({
        records,
        deletedIds: deletions.map((deletion) => deletion.id),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/sync/push', async (req, res, next) => {
    try {
      const incomingRecords = Array.isArray(req.body && req.body.records) ? req.body.records : [];
      const incomingDeletions = Array.isArray(req.body && req.body.deletedIds)
        ? req.body.deletedIds.map(parseDeletion).filter(Boolean)
        : [];
      const validRecords = incomingRecords.filter(isValidRecord);
      const rejectedIds = incomingRecords
        .filter((record) => !isValidRecord(record))
        .map((record) => (record && record.id) || null);

      const result = await storage.mergeRecords(validRecords, incomingDeletions);
      if ((result.acceptedIds.length > 0 || incomingDeletions.length > 0) && typeof options.onRecordsChanged === 'function') {
        options.onRecordsChanged();
      }

      res.json({
        acceptedIds: result.acceptedIds,
        duplicateIds: result.duplicateIds,
        rejectedIds,
        deletedIds: result.deletedIds,
        records: result.records,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error('FocusOrange sync API error', error);
    res.status(500).json({ error: 'internal_error' });
  });

  return {
    enabled,
    host,
    port,
    allowedOrigins,
    listen() {
      return new Promise((resolve, reject) => {
        const server = app.listen(port, host, () => resolve(server));
        server.on('error', reject);
      });
    },
  };
}

module.exports = {
  createSyncServer,
  DEFAULT_SYNC_HOST,
  DEFAULT_SYNC_PORT,
};

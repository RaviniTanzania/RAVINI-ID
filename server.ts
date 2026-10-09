import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import nmyApiRouter from './server/routes/nmyApi';
import { getNmyDb } from './server/db/nmyDb';
import { pool } from './src/db';
import { chatSocketServer } from './server/realtime/chatSocketServer';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize NIDA MITANDAO YOTE Authoritative Production Database (Cloud SQL PostgreSQL)
  const nmyDb = getNmyDb();
  await nmyDb.initialize();
  console.log('[NIDA MITANDAO YOTE] Authoritative Database Initialized: Cloud SQL PostgreSQL (Europe-West2)');

  // 15-Minute Request Timeout Checker Engine (Runs periodically every 30 seconds)
  nmyDb.checkAndExpireTimedOutRequests().catch(() => {});
  setInterval(() => {
    nmyDb.checkAndExpireTimedOutRequests().catch(err => console.error('[EXPIRE CHECK ERROR]:', err));
  }, 30000);

  // Initialize Realtime WebSocket Server on HTTP server
  chatSocketServer.initialize(server);

  // Serve media files with full HTTP Range Request support for smooth video streaming & scrubbing
  const uploadsPath = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  app.use('/data/uploads', (req, res, next) => {
    // Only handle GET and HEAD requests for streaming
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const relativeSubPath = decodeURIComponent(req.path.replace(/^\//, ''));
    const safeFilePath = path.normalize(path.join(uploadsPath, relativeSubPath));

    // Prevent directory traversal
    if (!safeFilePath.startsWith(uploadsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(safeFilePath)) {
      return next();
    }

    try {
      const stat = fs.statSync(safeFilePath);
      if (!stat.isFile()) {
        return next();
      }

      const ext = path.extname(safeFilePath).toLowerCase();
      const mediaMimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.ogg': 'video/ogg',
        '.ogv': 'video/ogg',
        '.m4v': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };

      const contentType = mediaMimeTypes[ext] || 'application/octet-stream';
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range && (ext.startsWith('.mp') || ext === '.webm' || ext === '.mov' || ext === '.ogg' || ext === '.wav' || ext === '.m4v')) {
        // Parse Range Header (e.g., "bytes=100-200" or "bytes=100-")
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start) || start >= fileSize) {
          res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
          return;
        }

        const validEnd = Math.min(end, fileSize - 1);
        const chunkSize = validEnd - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${validEnd}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        });

        if (req.method === 'HEAD') {
          return res.end();
        }

        const stream = fs.createReadStream(safeFilePath, { start, end: validEnd });
        stream.pipe(res);
        return;
      }

      // Standard full-file response with Accept-Ranges
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      });

      if (req.method === 'HEAD') {
        return res.end();
      }

      const stream = fs.createReadStream(safeFilePath);
      stream.pipe(res);
    } catch (streamErr) {
      console.error('[RAVINI Media Stream Error]:', streamErr);
      next();
    }
  });

  // Fallback static files
  app.use('/data/uploads', express.static(uploadsPath));

  // Mount RAVINI Vision 2 Production API routes
  app.use('/api/v2', nmyApiRouter);
  app.use('/api', nmyApiRouter);
  app.use('/api/v1', nmyApiRouter); // backwards compatibility alias for legacy clients

  // Legacy endpoints retired - marked as archived
  app.use('/api/ravini-clean', (req, res) => {
    res.status(410).json({
      success: false,
      status: 'ARCHIVED',
      message: 'Legacy clean API retired. Authoritative database is Cloud SQL PostgreSQL.'
    });
  });

  app.use('/api/legacy', (req, res) => {
    res.status(410).json({
      success: false,
      status: 'ARCHIVED',
      message: 'Legacy API retired. Authoritative database is Cloud SQL PostgreSQL.'
    });
  });

  // Production health check
  app.get('/api/health-server', async (req, res) => {
    try {
      const ping = await pool.query('SELECT current_database(), current_user, NOW() as db_time');
      res.json({
        status: 'ok',
        engine: 'NIDA MITANDAO YOTE Cloud SQL Server',
        databaseEngine: 'Google Cloud SQL PostgreSQL',
        databaseStatus: 'CONNECTED',
        databaseIdentity: 'NIDA_MITANDAO_YOTE_PROD_DB',
        realtime: 'WebSocket /ws ACTIVE',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'error',
        engine: 'NIDA MITANDAO YOTE Cloud SQL Server',
        databaseStatus: 'DISCONNECTED',
        error: 'Database connection unavailable',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Vite middleware for development vs static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[RAVINI Server] Running on http://0.0.0.0:${PORT} (HTTP & WebSocket)`);
  });
}

startServer();

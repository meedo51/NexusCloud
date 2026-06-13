import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { setupRoutes } from './routes';
import { authRoutes } from './routes/auth';
import { runMigrations } from './migration';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Ensure necessary directories exist
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  await runMigrations();

  app.use(cors());
  app.use(express.json());

  // Mount auth
  app.use('/api/auth', authRoutes);

  // Setup API Routes
  setupRoutes(app);

  // Serve static files from uploads via API
  app.use('/api/download', express.static(uploadDir));

  // Vite Integration (Dev middleware / Prod static serve)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

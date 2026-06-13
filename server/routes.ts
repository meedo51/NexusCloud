import { Application } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { readDB, writeDB, FileMeta, FolderMeta } from './db';
import { addDays, isAfter, parseISO } from 'date-fns';

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

export function setupRoutes(app: Application) {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Upload file
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const folderId = req.body.folderId === 'null' || !req.body.folderId ? null : req.body.folderId;
    
    const newFile: FileMeta = {
      id: uuidv4(),
      name: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.filename,
      folderId,
      uploadedAt: new Date().toISOString(),
      ownerId: 'default-user', // Mock user for now
    };

    const db = await readDB();
    db.files.push(newFile);
    await writeDB(db);

    res.json(newFile);
  });

  // List files and folders in a specific folder
  app.get('/api/items', async (req, res) => {
    const folderId = req.query.folderId as string || null;
    const db = await readDB();
    
    const files = db.files.filter(f => f.folderId === folderId);
    const folders = db.folders.filter(f => f.parentId === folderId);

    // Apply basic search if query is provided
    const search = req.query.q as string;
    if (search) {
      const lowerSearch = search.toLowerCase();
      return res.json({
        files: db.files.filter(f => f.name.toLowerCase().includes(lowerSearch)),
        folders: db.folders.filter(f => f.name.toLowerCase().includes(lowerSearch)),
      });
    }

    res.json({ files, folders });
  });

  // Create folder
  app.post('/api/folders', async (req, res) => {
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const newFolder: FolderMeta = {
      id: uuidv4(),
      name,
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      ownerId: 'default-user',
    };

    const db = await readDB();
    db.folders.push(newFolder);
    await writeDB(db);

    res.json(newFolder);
  });

  // Delete item
  app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // 'file' or 'folder'

    const db = await readDB();

    if (type === 'file') {
      const fileIndex = db.files.findIndex(f => f.id === id);
      if (fileIndex > -1) {
        const file = db.files[fileIndex];
        // Remove from FS
        fs.unlink(path.join(uploadDir, file.path), (err) => {
          if (err) console.error('Failed to delete file from FS', err);
        });
        db.files.splice(fileIndex, 1);
      }
    } else if (type === 'folder') {
      db.folders = db.folders.filter(f => f.id !== id);
      // Optional: recursively delete files/folders or orphan them.
    }

    await writeDB(db);
    res.json({ success: true });
  });

  // Rename item
  app.patch('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const { type, name } = req.body;

    const db = await readDB();
    if (type === 'file') {
      const file = db.files.find(f => f.id === id);
      if (file) file.name = name;
    } else {
      const folder = db.folders.find(f => f.id === id);
      if (folder) folder.name = name;
    }

    await writeDB(db);
    res.json({ success: true });
  });

  // Generate share link
  app.post('/api/share/:fileId', async (req, res) => {
    const { fileId } = req.params;
    const db = await readDB();
    const file = db.files.find(f => f.id === fileId);

    if (!file) return res.status(404).json({ error: 'File not found' });

    const shareId = uuidv4();
    file.shareId = shareId;
    file.shareExpiresAt = addDays(new Date(), 7).toISOString(); // 7 days expiration

    await writeDB(db);

    // Get the base URL from env or use default localhost
    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ shareUrl: `${baseUrl}/share/${shareId}`, expiresAt: file.shareExpiresAt });
  });

  // Get shared file
  app.get('/api/shared/:shareId', async (req, res) => {
    const { shareId } = req.params;
    const db = await readDB();
    const file = db.files.find(f => f.shareId === shareId);

    if (!file) return res.status(404).json({ error: 'Not found or revoked' });

    if (file.shareExpiresAt && isAfter(new Date(), parseISO(file.shareExpiresAt))) {
      return res.status(410).json({ error: 'Link expired' });
    }

    res.json(file);
  });
}

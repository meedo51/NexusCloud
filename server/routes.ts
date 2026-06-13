import { Application } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { readDB, writeDB, FileMeta, FolderMeta } from './db';
import { addDays, isAfter, parseISO } from 'date-fns';
import { authenticate, AuthenticatedRequest } from './middleware/auth';
import { apiLimiter, shareLimiter } from './middleware/rateLimit';

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
  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Upload file
  app.post('/api/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res) => {
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
      ownerId: req.user!.id,
    };

    const db = await readDB();
    db.files.push(newFile);
    await writeDB(db);

    res.json(newFile);
  });

  // List files and folders in a specific folder
  app.get('/api/items', authenticate, async (req: AuthenticatedRequest, res) => {
    const folderId = req.query.folderId as string || null;
    const db = await readDB();
    
    // Only return user's files
    const userFiles = db.files.filter(f => f.ownerId === req.user!.id || f.ownerId === 'default-user');
    const userFolders = db.folders.filter(f => f.ownerId === req.user!.id || f.ownerId === 'default-user');

    const files = userFiles.filter(f => f.folderId === folderId);
    const folders = userFolders.filter(f => f.parentId === folderId);

    // Apply basic search if query is provided
    const search = req.query.q as string;
    if (search) {
      const lowerSearch = search.toLowerCase();
      return res.json({
        files: userFiles.filter(f => f.name.toLowerCase().includes(lowerSearch)),
        folders: userFolders.filter(f => f.name.toLowerCase().includes(lowerSearch)),
      });
    }

    res.json({ files, folders });
  });

  // Create folder
  app.post('/api/folders', authenticate, async (req: AuthenticatedRequest, res) => {
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const newFolder: FolderMeta = {
      id: uuidv4(),
      name,
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      ownerId: req.user!.id,
    };

    const db = await readDB();
    db.folders.push(newFolder);
    await writeDB(db);

    res.json(newFolder);
  });

  // Delete item
  app.delete('/api/items/:id', authenticate, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { type } = req.query; 

    const db = await readDB();

    if (type === 'file') {
      const fileIndex = db.files.findIndex(f => f.id === id && (f.ownerId === req.user!.id || f.ownerId === 'default-user'));
      if (fileIndex > -1) {
        const file = db.files[fileIndex];
        fs.unlink(path.join(uploadDir, file.path), (err) => {
          if (err) console.error('Failed to delete file from FS', err);
        });
        db.files.splice(fileIndex, 1);
      } else {
        return res.status(403).json({ error: 'Unauthorized or not found' });
      }
    } else if (type === 'folder') {
      const folderIndex = db.folders.findIndex(f => f.id === id && (f.ownerId === req.user!.id || f.ownerId === 'default-user'));
      if (folderIndex > -1) {
        db.folders.splice(folderIndex, 1);
      } else {
        return res.status(403).json({ error: 'Unauthorized or not found' });
      }
    }

    await writeDB(db);
    res.json({ success: true });
  });

  // Rename item
  app.patch('/api/items/:id', authenticate, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { type, name } = req.body;

    const db = await readDB();
    if (type === 'file') {
      const file = db.files.find(f => f.id === id && (f.ownerId === req.user!.id || f.ownerId === 'default-user'));
      if (file) file.name = name;
      else return res.status(403).json({ error: 'Unauthorized' });
    } else {
      const folder = db.folders.find(f => f.id === id && (f.ownerId === req.user!.id || f.ownerId === 'default-user'));
      if (folder) folder.name = name;
      else return res.status(403).json({ error: 'Unauthorized' });
    }

    await writeDB(db);
    res.json({ success: true });
  });

  // Generate share link
  app.post('/api/share/:fileId', authenticate, shareLimiter, async (req: AuthenticatedRequest, res) => {
    const { fileId } = req.params;
    const db = await readDB();
    const file = db.files.find(f => f.id === fileId && (f.ownerId === req.user!.id || f.ownerId === 'default-user'));

    if (!file) return res.status(404).json({ error: 'File not found or unauthorized' });

    const shareId = uuidv4();
    file.shareId = shareId;
    file.shareExpiresAt = addDays(new Date(), 7).toISOString(); 

    await writeDB(db);

    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ shareUrl: `${baseUrl}/share/${shareId}`, expiresAt: file.shareExpiresAt });
  });

  // Get shared file (Publicly accessible if shareId is correct)
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

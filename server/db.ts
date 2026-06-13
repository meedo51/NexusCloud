import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(dataDir, 'db.json');

export interface FileMeta {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  folderId: string | null;
  uploadedAt: string;
  shareId?: string;
  sharePasswordHash?: string;
  shareExpiresAt?: string;
  ownerId: string;
}

export interface FolderMeta {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  ownerId: string;
}

export interface UserMeta {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface DatabaseStructure {
  files: FileMeta[];
  folders: FolderMeta[];
  users: UserMeta[];
}

const defaultDB: DatabaseStructure = { files: [], folders: [], users: [] };

export async function readDB(): Promise<DatabaseStructure> {
  try {
    if (!existsSync(DB_FILE)) {
      await writeDB(defaultDB);
      return defaultDB;
    }
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB', err);
    return defaultDB;
  }
}

export async function writeDB(data: DatabaseStructure): Promise<void> {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB', err);
  }
}


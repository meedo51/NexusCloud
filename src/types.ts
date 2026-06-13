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
  shareExpiresAt?: string;
}

export interface FolderMeta {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

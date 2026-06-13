import React, { useState, useEffect, useCallback } from 'react';
import { UploadDropzone } from './components/UploadDropzone';
import { FileGrid } from './components/FileGrid';
import { ShareModal } from './components/ShareModal';
import { FileMeta, FolderMeta } from './types';
import { FolderPlus, Search, HardDrive, Settings, LogOut, ChevronRight, Home } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authenticatedFetch, getAuthHeaders } from './services/api';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-space-dark text-[#00F0FF]">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppProvider() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function App() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [folders, setFolders] = useState<FolderMeta[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [renameItemId, setRenameItemId] = useState<{ id: string, type: 'file' | 'folder', currentName: string } | null>(null);
  const { logout, user } = useAuth();

  const fetchItems = useCallback(async (folderId: string | null, query: string = '') => {
    try {
      const url = new URL('/api/items', window.location.origin);
      if (folderId) url.searchParams.append('folderId', folderId);
      if (query) url.searchParams.append('q', query);
      
      const res = await authenticatedFetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to fetch items', err);
    }
  }, []);

  useEffect(() => {
    fetchItems(currentFolderId, searchQuery);
  }, [currentFolderId, searchQuery, fetchItems]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUpload = async (uploadFiles: File[]) => {
    setIsUploading(true);
    for (const file of uploadFiles) {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) formData.append('folderId', currentFolderId);

      try {
        await fetch('/api/upload', {
          method: 'POST',
          headers: {
            ...getAuthHeaders()
          },
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
    await fetchItems(currentFolderId, searchQuery);
    setIsUploading(false);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await authenticatedFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: currentFolderId }),
      });
      setNewFolderName('');
      setIsCreatingFolder(false);
      fetchItems(currentFolderId, searchQuery);
    } catch (err) {
      console.error('Failed to create folder', err);
    }
  };

  const handleDeleteItem = async (id: string, type: 'file' | 'folder') => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await authenticatedFetch(`/api/items/${id}?type=${type}`, { method: 'DELETE' });
      fetchItems(currentFolderId, searchQuery);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameItemId || !renameItemId.currentName.trim()) return;

    try {
      await authenticatedFetch(`/api/items/${renameItemId.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: renameItemId.type, name: renameItemId.currentName }),
      });
      setRenameItemId(null);
      fetchItems(currentFolderId, searchQuery);
    } catch (err) {
      console.error('Rename failed', err);
    }
  };

  const handleShare = async (id: string) => {
    setShareFileId(id);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-space-dark text-[#E0E0E0] selection:bg-[#00F0FF]/30">
      {/* Animated Background Layer */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#00F0FF] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF6B6B] rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-space-sidebar border-r border-white/5 hidden sm:flex z-20">
        <div className="p-8 flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00F0FF] to-[#FF6B6B] rounded-lg shadow-lg shadow-[#00F0FF]/20 flex items-center justify-center">
            <HardDrive className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Nexus<span className="text-[#00F0FF]">Cloud</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`flex w-full items-center px-4 py-3 rounded-xl transition-colors text-sm font-medium border border-transparent ${!currentFolderId ? 'bg-white/5 border border-white/10 text-[#00F0FF]' : 'text-gray-400 hover:text-white'}`}
          >
            <Home className="mr-3 h-5 w-5" />
            All Files
          </button>
          
          <div className="p-6 mt-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400">Storage Used</span>
                <span className="text-white font-medium">45%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                <div className="bg-gradient-to-r from-[#00F0FF] to-[#FF6B6B] h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-[10px] text-gray-500">45 GB of 100 GB used</p>
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex w-full items-center mb-4 px-4 py-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 border-2 border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase">{user?.email?.charAt(0) || 'U'}</div>
             <span className="ml-3 text-xs text-gray-400 truncate max-w-[120px]">{user?.email}</span>
          </div>
          <button className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </button>
          <button onClick={logout} className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-brand-coral hover:bg-brand-coral/10 transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 z-10 backdrop-blur-md bg-[#0B0F19]/50">
          <div className="flex flex-1 items-center">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm font-medium text-gray-300 space-x-2">
              <button onClick={() => setCurrentFolderId(null)} className="hover:text-white transition-colors text-brand-cyan">My Files</button>
              {currentFolderId && (
                <>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                  <span className="text-white">Folder</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search your files..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all text-white placeholder-gray-500"
              />
            </div>
            
            <button 
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] text-[#0B0F19] px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#00F0FF]/20"
            >
              <FolderPlus className="w-5 h-5" />
              <span>New Folder</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-10 flex-1 z-10 overflow-auto">
          {renameItemId && (
            <form onSubmit={handleRename} className="glass-panel mb-6 flex animate-in fade-in slide-in-from-top-4 items-center space-x-3 rounded-xl p-4 max-w-md">
              <input
                type="text"
                autoFocus
                value={renameItemId.currentName}
                onChange={(e) => setRenameItemId({...renameItemId, currentName: e.target.value})}
                placeholder="New name"
                className="flex-1 rounded-md bg-space-dark border border-glass-border px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
              />
              <button type="submit" className="rounded-md bg-brand-cyan px-4 py-1.5 text-sm font-semibold text-space-dark hover:bg-brand-cyan/90">Rename</button>
              <button type="button" onClick={() => setRenameItemId(null)} className="text-sm text-gray-400 hover:text-white">Cancel</button>
            </form>
          )}

          {isCreatingFolder && !renameItemId && (
            <form onSubmit={handleCreateFolder} className="glass-panel mb-8 flex animate-in fade-in slide-in-from-top-4 items-center space-x-3 rounded-2xl p-5 max-w-xl">
              <div className="p-3 bg-[#00F0FF]/10 rounded-xl text-[#00F0FF]">
                <FolderPlus className="w-6 h-6" />
              </div>
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 transition-all"
              />
              <button type="submit" className="rounded-lg bg-[#00F0FF] px-6 py-2 text-sm font-bold text-[#0B0F19] hover:bg-[#00F0FF]/90 transition-all">Create</button>
              <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-sm font-medium text-gray-400 hover:text-white ml-2">Cancel</button>
            </form>
          )}

          <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />

          <div className="mb-8 mt-10">
            <h2 className="text-2xl font-semibold text-white">All Files</h2>
            <p className="text-gray-500 text-sm mt-1">Files &bull; Workspace</p>
          </div>

          <FileGrid 
            files={files} 
            folders={folders} 
            onFolderClick={setCurrentFolderId} 
            onDeleteFile={(id) => handleDeleteItem(id, 'file')}
            onDeleteFolder={(id) => handleDeleteItem(id, 'folder')}
            onRename={(id, type, currentName) => setRenameItemId({ id, type, currentName })}
            onShare={(id) => setShareFileId(id)}
          />
        </div>
      </main>

      {shareFileId && (
        <ShareModal 
          isOpen={true} 
          fileId={shareFileId} 
          onClose={() => setShareFileId(null)} 
        />
      )}
    </div>
  );
}

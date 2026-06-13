import React from 'react';
import { FileMeta, FolderMeta } from '../types';
import { FileIcon, Folder as FolderIcon, MoreVertical, Share2, Trash2, Edit2, Download } from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { motion } from 'motion/react';

interface FileGridProps {
  files: FileMeta[];
  folders: FolderMeta[];
  onFolderClick: (folderId: string) => void;
  onDeleteFile: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onRename: (id: string, type: 'file' | 'folder', currentName: string) => void;
  onShare: (id: string) => void;
}

export function FileGrid({ files, folders, onFolderClick, onDeleteFile, onDeleteFolder, onRename, onShare }: FileGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {folders.map((folder) => (
        <motion.div
          key={folder.id}
          whileHover={{ y: -2 }}
          onClick={() => onFolderClick(folder.id)}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#00F0FF]/40 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#00F0FF]/10 rounded-xl text-[#00F0FF]">
              <FolderIcon className="w-8 h-8" fill="currentColor" fillOpacity={0.2} />
            </div>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onRename(folder.id, 'folder', folder.name); }}
                className="text-gray-500 hover:text-blue-400 p-1"
                title="Rename folder"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                className="text-gray-500 hover:text-red-400 p-1 ml-1"
                title="Delete folder"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <h3 className="text-white font-medium text-sm truncate">{folder.name}</h3>
          <div className="flex justify-between mt-4 text-[10px] text-gray-500 font-medium">
            <span>Folder</span>
            <span>{format(parseISO(folder.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </motion.div>
      ))}

      {files.map((file) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -2 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#FF6B6B]/40 transition-all cursor-default group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-full aspect-[4/3] bg-[#1a1f2e] rounded-xl overflow-hidden border border-white/5 relative group-hover:shadow-lg transition-all">
              {file.mimeType.startsWith('image/') ? (
                <img src={`/api/download/${file.path}`} alt={file.name} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <FileIcon className="w-10 h-10 text-white/20" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-white font-medium text-sm truncate flex-1 pr-2" title={file.name}>{file.name}</h3>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#0B0F19]/50 backdrop-blur rounded p-1">
              <button onClick={() => onRename(file.id, 'file', file.name)} className="text-gray-500 hover:text-blue-400 transition-colors p-1" title="Rename file">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => onShare(file.id)} className="text-gray-500 hover:text-[#00F0FF] transition-colors p-1" title="Share file">
                <Share2 className="w-4 h-4" />
              </button>
              <a 
                href={`/api/download/${file.path}`}
                download={file.originalName}
                className="text-gray-500 hover:text-white transition-colors p-1" 
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => onDeleteFile(file.id)} className="text-gray-500 hover:text-[#FF6B6B] transition-colors p-1" title="Delete file">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-medium">
            <span>{formatBytes(file.size)}</span>
            <span>{format(parseISO(file.uploadedAt), 'MMM d, yyyy')}</span>
          </div>
        </motion.div>
      ))}
      
      {folders.length === 0 && files.length === 0 && (
        <div className="col-span-full py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-space-light">
            <FileIcon className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white">This folder is empty</h3>
          <p className="text-gray-400">Upload files or create subfolders to get started.</p>
        </div>
      )}
    </div>
  );
}

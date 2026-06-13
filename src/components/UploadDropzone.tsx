import { motion } from 'motion/react';
import React, { useCallback, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface UploadDropzoneProps {
  onUpload: (files: File[]) => void;
  isUploading?: boolean;
}

export function UploadDropzone({ onUpload, isUploading }: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  }, [onUpload]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
  }, [onUpload]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative mt-4 mb-4 rounded-[32px] border-2 border-dashed p-10 transition-all duration-300 bg-gradient-to-r ${
        isDragActive 
          ? 'border-[#00F0FF] from-white/10 to-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.2)]' 
          : 'border-white/10 hover:border-[#00F0FF]/40 from-white/5 to-transparent backdrop-blur-xl'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        onChange={handleChange}
        className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
        disabled={isUploading}
      />
      <div className="flex items-center justify-center space-x-6 text-left">
        <div className="flex shrink-0 h-16 w-16 items-center justify-center rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF]">
          <UploadCloud className="h-8 w-8" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white">
            {isUploading ? 'Uploading your files...' : 'Secure Drag & Drop Upload'}
          </h4>
          <p className="text-sm text-gray-400">
            {isUploading ? 'Please wait, encryption and transfer in progress.' : 'Click or drop files here. Handled instantly and securely stored.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

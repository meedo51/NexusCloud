import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Copy } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
}

export function ShareModal({ isOpen, onClose, fileId }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${fileId}`, { method: 'POST' });
      const data = await res.json();
      setShareUrl(data.shareUrl);
      setExpiresAt(data.expiresAt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-[#0B0F19] border border-white/10 backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl shadow-[#00F0FF]/10 text-left"
          >
            <div className="flex items-center justify-between pb-6">
              <h2 className="text-xl font-semibold text-white">Share Link Generator</h2>
              <button onClick={onClose} className="rounded p-1 text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="pt-2">
              {!shareUrl ? (
                <div className="">
                  <p className="mb-6 text-sm text-gray-400">
                    Generate an expirable, protected link instantly. By default, links automatically expire in 7 days to maintain maximum security.
                  </p>
                  <button
                    onClick={generateLink}
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#00B8FF] px-6 py-3 text-sm font-bold text-[#0B0F19] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[#00F0FF]/20"
                  >
                    {loading ? 'Generating Link...' : 'Generate Quick Share Link'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Secure Link Generated</label>
                    <div className="mt-2 flex items-center space-x-3">
                      <div className="flex-1 overflow-hidden bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs font-mono text-gray-300">
                        {shareUrl}
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="bg-white text-[#0B0F19] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#00F0FF] transition-all"
                      >
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#FF6B6B]/20 bg-[#FF6B6B]/5 p-4 text-[#FF6B6B] text-xs flex items-center space-x-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>This secure link will safely expire on {new Date(expiresAt).toLocaleDateString()}.</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

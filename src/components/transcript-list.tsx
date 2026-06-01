'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, Trash2, Edit2, Check, X, FileAudio, Database } from 'lucide-react';
import { cn, formatDuration, formatFileSize } from '@/lib/utils';

interface Transcript {
  _id: string;
  title: string;
  transcription: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  language: string;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

interface TranscriptListProps {
  activeId: string | null;
  onSelect: (transcript: Transcript) => void;
  refreshTrigger: number;
  onDeleteActive: () => void;
}

export const TranscriptList = ({
  activeId,
  onSelect,
  refreshTrigger,
  onDeleteActive,
}: TranscriptListProps) => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchTranscripts = async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const url = searchQuery
        ? `${baseUrl}/api/transcripts?search=${encodeURIComponent(searchQuery)}`
        : `${baseUrl}/api/transcripts`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTranscripts(data);
      }
    } catch (err) {
      console.error('Failed to fetch transcripts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscripts();
  }, [searchQuery, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this log entry? This will wipe the database and clean files from disk.')) {
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/transcripts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTranscripts((prev) => prev.filter((item) => item._id !== id));
        if (activeId === id) {
          onDeleteActive();
        }
      }
    } catch (err) {
      console.error('Failed to delete transcript:', err);
    }
  };

  const startEditing = (e: React.MouseEvent, item: Transcript) => {
    e.stopPropagation();
    setEditingId(item._id);
    setEditTitle(item.title);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveRename = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/transcripts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editTitle }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTranscripts((prev) =>
          prev.map((item) => (item._id === id ? { ...item, title: updated.title } : item))
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to rename transcript:', err);
    }
  };

  // Helper to extract audio container suffix
  const getFormatSuffix = (mime: string) => {
    if (!mime) return 'AUD';
    if (mime.includes('mpeg') || mime.includes('mp3')) return 'MP3';
    if (mime.includes('wav')) return 'WAV';
    if (mime.includes('webm')) return 'WEBM';
    if (mime.includes('m4a') || mime.includes('x-m4a')) return 'M4A';
    if (mime.includes('ogg')) return 'OGG';
    return 'AUD';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input Box */}
      <div className="relative mb-5 shrink-0">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
          <Search className="h-4 w-4 text-[#D97756]" />
        </span>
        <input
          type="text"
          placeholder="Search logs database..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#E8E2D9] focus:outline-none focus:border-[#D97756] focus:ring-2 focus:ring-[#D97756]/10 text-xs font-mono text-[#191919] placeholder-slate-400 transition-all duration-200"
        />
      </div>

      {/* Database logs items */}
      <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 scrollbar-thin">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-brand-indigo" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" />
            </svg>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono border border-dashed border-[#E8E2D9] rounded-2xl bg-white/40">
            No entries found in query.
          </div>
        ) : (
          transcripts.map((item) => {
            const isActive = item._id === activeId;
            const isEditing = item._id === editingId;
            const formatBadge = getFormatSuffix(item.mimeType);

            return (
              <div
                key={item._id}
                onClick={() => item.status === 'completed' && onSelect(item)}
                className={cn(
                  'relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none group',
                  isActive
                    ? 'bg-[#F5F2EB] border-[#D97756] shadow-sm'
                    : 'border-[#E8E2D9] bg-white hover:bg-[#F5F2EB]/40 hover:border-[#D5CFC4]'
                )}
              >
                {/* Active left border light indicator */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg bg-gradient-to-b from-[#4A7C59] to-[#D97756]"></div>
                )}

                <div className="flex items-start justify-between gap-3 mb-2.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-[#E8E2D9] rounded-lg focus:outline-none focus:border-[#D97756] text-[#191919] font-sans"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => saveRename(e, item._id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-brand-pink hover:bg-red-50 rounded-lg border border-transparent transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate text-[#191919]">
                        {item.title}
                      </h4>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                      <button
                        onClick={(e) => startEditing(e, item)}
                        className="p-1 text-slate-400 hover:text-[#191919] rounded-lg hover:bg-[#F5F2EB]/80 border border-transparent transition-all"
                        title="Rename Log"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item._id)}
                        className="p-1 text-slate-400 hover:text-brand-pink rounded-lg hover:bg-red-50 border border-transparent transition-all"
                        title="Delete Log"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtitle Details Layout */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-450" title="Duration">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatDuration(item.duration)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-450" title="File Size">
                      <Database className="h-3.5 w-3.5 text-slate-400" />
                      {formatFileSize(item.fileSize)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-450" title="Format">
                      <FileAudio className="h-3.5 w-3.5 text-slate-400" />
                      {formatBadge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-semibold">
                    {/* Language Badge */}
                    {item.status === 'completed' && item.language && (
                      <span className="px-1.5 py-0.5 rounded bg-[#F5F2EB] border border-[#E8E2D9] text-slate-500 font-semibold tracking-wider text-[8px]">
                        {item.language.toUpperCase()}
                      </span>
                    )}

                    {item.status === 'processing' && (
                      <span className="flex items-center gap-1 text-brand-indigo font-bold animate-pulse uppercase tracking-wider text-[8px]">
                        <span className="h-1 w-1 rounded-full bg-brand-indigo"></span>
                        syncing
                      </span>
                    )}

                    {item.status === 'failed' && (
                      <span className="flex items-center gap-1 text-brand-pink font-bold uppercase tracking-wider text-[8px]" title={item.errorMessage}>
                        <span className="h-1 w-1 rounded-full bg-brand-pink animate-ping"></span>
                        failed
                      </span>
                    )}

                    {item.status === 'completed' && (
                      <span className="flex items-center gap-1 text-brand-cyan font-bold uppercase tracking-wider text-[8px]">
                        <span className="h-1 w-1 rounded-full bg-brand-cyan"></span>
                        ready
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TranscriptList;

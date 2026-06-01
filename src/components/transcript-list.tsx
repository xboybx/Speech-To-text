'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, FileText, Trash2, Edit2, Check, X, AlertTriangle, FileAudio } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface Transcript {
  _id: string;
  title: string;
  transcription: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
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
    if (!confirm('Are you sure you want to delete this transcription?')) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="relative mb-4 shrink-0">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Filter logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg flat-input text-xs font-mono"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
        {isLoading ? (
          <div className="h-28 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" />
            </svg>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 text-xs font-mono">
            No logs.
          </div>
        ) : (
          transcripts.map((item) => {
            const isActive = item._id === activeId;
            const isEditing = item._id === editingId;

            return (
              <div
                key={item._id}
                onClick={() => item.status === 'completed' && onSelect(item)}
                className={cn(
                  'p-3 rounded-lg border transition-all duration-100 cursor-pointer select-none group',
                  isActive
                    ? 'bg-zinc-800/80 border-zinc-700'
                    : 'border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900/70 hover:border-zinc-800'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-1.5 py-0.5 text-xs bg-zinc-950 border border-zinc-700 rounded focus:outline-none text-zinc-200"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => saveRename(e, item._id)}
                        className="p-0.5 text-emerald-500 hover:bg-emerald-950/20 rounded"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-0.5 text-red-400 hover:bg-red-950/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-xs font-semibold truncate",
                        isActive ? "text-zinc-50" : "text-zinc-300 group-hover:text-zinc-100"
                      )}>
                        {item.title}
                      </h4>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => startEditing(e, item)}
                        className="p-1 text-zinc-500 hover:text-zinc-350 rounded hover:bg-zinc-800"
                        title="Rename"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item._id)}
                        className="p-1 text-zinc-650 hover:text-red-450 rounded hover:bg-red-950/10"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtitle Details */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(item.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileAudio className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    {item.status === 'processing' && (
                      <span className="text-zinc-400 animate-pulse">syncing</span>
                    )}

                    {item.status === 'failed' && (
                      <span className="text-red-400 font-bold" title={item.errorMessage}>failed</span>
                    )}

                    {item.status === 'completed' && (
                      <span className="text-zinc-500">ready</span>
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

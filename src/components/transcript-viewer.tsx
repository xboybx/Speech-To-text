'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Download, Save, Check, FileText, Globe, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, formatDuration } from '@/lib/utils';

interface Transcript {
  _id: string;
  title: string;
  transcription: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  mimeType: string;
  language: string;
  wordCount: number;
  createdAt: string;
}

interface TranscriptViewerProps {
  transcript: Transcript;
  onUpdate: (updated: Transcript) => void;
}

export const TranscriptViewer = ({ transcript, onUpdate }: TranscriptViewerProps) => {
  const [editableText, setEditableText] = useState(transcript.transcription);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setEditableText(transcript.transcription);
    setSaveSuccess(false);
  }, [transcript]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/transcripts/${transcript._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: editableText }),
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdate(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save transcription changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([editableText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${transcript.title.replace(/\s+/g, '_')}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadJson = () => {
    const element = document.createElement('a');
    const dataStr = JSON.stringify(
      {
        id: transcript._id,
        title: transcript.title,
        transcription: editableText,
        duration: transcript.duration,
        fileSize: transcript.fileSize,
        language: transcript.language,
        createdAt: transcript.createdAt,
      },
      null,
      2
    );
    const file = new Blob([dataStr], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${transcript.title.replace(/\s+/g, '_')}_transcript.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const hasChanges = editableText !== transcript.transcription;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-3">
        <div className="text-left">
          <h2 className="text-sm font-bold text-zinc-100 tracking-wide">{transcript.title}</h2>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-zinc-650" />
              Lang: <span className="font-semibold text-zinc-400 uppercase">{transcript.language}</span>
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-zinc-650" />
              Words: <span className="font-semibold text-zinc-400">{transcript.wordCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3 text-zinc-650" />
              Size: <span className="font-semibold text-zinc-400">{formatFileSize(transcript.fileSize)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="rounded px-2.5 py-1 h-8 text-xs font-mono"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3 mr-1 text-emerald-500" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1 text-zinc-400" /> Copy
              </>
            )}
          </Button>

          <Button
            onClick={handleDownloadTxt}
            variant="outline"
            size="sm"
            className="rounded px-2.5 py-1 h-8 text-xs font-mono"
          >
            <Download className="h-3 w-3 mr-1 text-zinc-400" /> TXT
          </Button>

          <Button
            onClick={handleDownloadJson}
            variant="outline"
            size="sm"
            className="rounded px-2.5 py-1 h-8 text-xs font-mono"
          >
            <Download className="h-3 w-3 mr-1 text-zinc-400" /> JSON
          </Button>
        </div>
      </div>

      {/* Audio playback */}
      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-[10px] text-zinc-500 font-mono">Audio Source</span>
        <audio src={transcript.audioUrl} controls className="flex-1 max-h-8 max-w-sm border-0 outline-none text-xs" />
      </div>

      {/* Text area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <textarea
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          className="w-full flex-1 p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 resize-none font-mono leading-relaxed overflow-y-auto scrollbar-thin"
          placeholder="Loading transcription data..."
        />
        
        {/* Float save indicators */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {saveSuccess && (
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-950/20 border border-emerald-900/50 px-2 py-1 rounded">
              Saved
            </span>
          )}
          
          {hasChanges && (
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              variant="primary"
              size="sm"
              className="rounded h-8 text-xs font-mono px-3"
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default TranscriptViewer;

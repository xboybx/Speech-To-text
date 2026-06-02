'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Download, 
  Save, 
  Check, 
  FileText, 
  Globe, 
  Info, 
  Play, 
  Pause, 
  Volume2, 
  ChevronsRight, 
  Sparkles 
} from 'lucide-react';
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

  // Custom Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(transcript.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    setEditableText(transcript.transcription);
    setSaveSuccess(false);
    
    // Reset player states when transcript changes
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);
    
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.playbackRate = 1;
    }
  }, [transcript]);

  // Audio Handlers
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error(err));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setPlayerDuration(audioRef.current.duration || transcript.duration);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedToggle = () => {
    if (!audioRef.current) return;
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2.0;
    else nextRate = 1;

    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Text Handlers
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

  // Split lines for IDE display
  const textLines = editableText.split('\n');

  return (
    <div className="flex flex-col h-full space-y-5 text-left">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={
          transcript.audioUrl.startsWith('https://') && transcript.audioUrl.includes('vercel-storage.com')
            ? `/api/audio?url=${encodeURIComponent(transcript.audioUrl)}`
            : transcript.audioUrl
        }
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Header Info Panel */}
      <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 flex-wrap gap-4">
        <div className="text-left">
          <h2 className="text-sm font-bold text-[#191919] tracking-wide flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-brand-indigo" /> {transcript.title}
          </h2>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 bg-[#F5F2EB] px-2 py-0.5 rounded border border-[#E8E2D9]">
              <Globe className="h-3 w-3 text-brand-cyan" />
              LANG: <span className="font-semibold text-slate-600 uppercase">{transcript.language}</span>
            </span>
            <span className="flex items-center gap-1 bg-[#F5F2EB] px-2 py-0.5 rounded border border-[#E8E2D9]">
              <Sparkles className="h-3 w-3 text-brand-purple" />
              WORDS: <span className="font-semibold text-slate-600">{transcript.wordCount}</span>
            </span>
            <span className="flex items-center gap-1 bg-[#F5F2EB] px-2 py-0.5 rounded border border-[#E8E2D9]">
              <Info className="h-3 w-3 text-slate-400" />
              SIZE: <span className="font-semibold text-slate-600">{formatFileSize(transcript.fileSize)}</span>
            </span>
          </div>
        </div>

        {/* Exporter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="rounded-lg px-3 py-1 h-8 text-[11px] font-mono border-[#E8E2D9] hover:bg-[#F5F2EB]/50 bg-white"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-brand-cyan" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" /> Copy
              </>
            )}
          </Button>

          <Button
            onClick={handleDownloadTxt}
            variant="outline"
            size="sm"
            className="rounded-lg px-3 py-1 h-8 text-[11px] font-mono border-[#E8E2D9] hover:bg-[#F5F2EB]/50 bg-white"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" /> TXT
          </Button>

          <Button
            onClick={handleDownloadJson}
            variant="outline"
            size="sm"
            className="rounded-lg px-3 py-1 h-8 text-[11px] font-mono border-[#E8E2D9] hover:bg-[#F5F2EB]/50 bg-white"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" /> JSON
          </Button>
        </div>
      </div>

      {/* Custom HTML5 Audio Player */}
      <div className="p-4 rounded-2xl bg-[#F5F2EB] border border-[#E8E2D9] flex items-center justify-between gap-5 flex-wrap sm:flex-nowrap shadow-sm">
        
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="h-10 w-10 rounded-full bg-brand-indigo flex items-center justify-center text-white hover:bg-[#c66847] shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-4.5 w-4.5 fill-white" />
          ) : (
            <Play className="h-4.5 w-4.5 fill-white ml-0.5" />
          )}
        </button>

        {/* Timeline Slider / Progress */}
        <div className="flex-1 flex items-center gap-3 w-full">
          <span className="text-[10px] font-mono text-slate-500 w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          
          <input
            type="range"
            min={0}
            max={playerDuration || 100}
            value={currentTime}
            onChange={handleScrubberChange}
            className="flex-1 h-1.5 bg-[#E8E2D9] rounded-lg appearance-none cursor-pointer accent-[#D97756]"
            style={{
              background: `linear-gradient(to right, #D97756 0%, #D97756 ${
                playerDuration > 0 ? (currentTime / playerDuration) * 100 : 0
              }%, #E8E2D9 ${
                playerDuration > 0 ? (currentTime / playerDuration) * 100 : 0
              }%, #E8E2D9 100%)`
            }}
          />

          <span className="text-[10px] font-mono text-slate-500 w-10">
            {formatDuration(playerDuration)}
          </span>
        </div>

        {/* Player Speed Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSpeedToggle}
            className="px-2.5 py-1 rounded-lg border border-[#E8E2D9] bg-white text-[10px] font-mono text-[#191919] hover:bg-[#F5F2EB]/50 transition-colors flex items-center gap-1 cursor-pointer"
            title="Toggle playback speed"
          >
            <ChevronsRight className="h-3 w-3 text-slate-400" />
            {playbackRate.toFixed(2)}x
          </button>

          <div className="p-1 text-slate-400">
            <Volume2 className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Editor container styled as IDE review document */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden flex-1 min-h-0 relative shadow-sm">
          
          {/* Custom line numbers sidebar */}
          <div className="bg-[#F5F2EB]/30 border-r border-[#E8E2D9] p-4.5 pt-4.5 pr-2.5 text-right select-none font-mono text-[9px] text-[#A6A199] flex flex-col gap-0.5 pointer-events-none w-10 shrink-0 select-none">
            {textLines.map((_, index) => (
              <div key={index} className="h-5 flex items-center justify-end">
                {String(index + 1).padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Code Textarea editor area */}
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            className="w-full flex-1 p-4.5 bg-transparent text-xs text-[#191919] focus:outline-none resize-none font-mono leading-5 overflow-y-auto scrollbar-thin"
            placeholder="Loading transcription workspace..."
          />
          
          {/* Float save indicators inside editor */}
          <div className="absolute bottom-5 right-5 flex items-center gap-2">
            {saveSuccess && (
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-xl">
                Changes saved
              </span>
            )}
            
            {hasChanges && (
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                variant="primary"
                size="sm"
                className="rounded-xl h-9 text-xs font-mono px-3.5 uppercase tracking-wider shadow-sm"
              >
                <Save className="h-4 w-4 mr-1.5" /> Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;

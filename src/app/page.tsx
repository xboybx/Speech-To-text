'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  UploadCloud, 
  History, 
  LayoutDashboard, 
  Volume2, 
  ArrowLeft, 
  RotateCcw, 
  Share2, 
  Database,
  Cpu,
  Settings,
  Disc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AudioRecorder } from '@/components/audio-recorder';
import { AudioUploader } from '@/components/audio-uploader';
import { TranscriptList } from '@/components/transcript-list';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { StatsDashboard } from '@/components/stats-dashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [selectedTranscript, setSelectedTranscript] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  // Advanced Configuration State
  const [sttEngine, setSttEngine] = useState<'deepgram' | 'whisper'>('deepgram');
  const [sttLanguage, setSttLanguage] = useState<string>('en');
  const [diarization, setDiarization] = useState<boolean>(true);
  const [punctuation, setPunctuation] = useState<boolean>(true);

  // Storage calculation state
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const maxStorageBytes = 50 * 1024 * 1024; // 50MB capacity ceiling

  // Fetch storage calculations from list
  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/transcripts`);
        if (response.ok) {
          const list = await response.json();
          let sumBytes = 0;
          list.forEach((item: any) => {
            if (item.status === 'completed') {
              sumBytes += item.fileSize || 0;
            }
          });
          setStorageUsedBytes(sumBytes);
        }
      } catch (err) {
        console.error('Failed to load storage size:', err);
      }
    };
    fetchStorage();
  }, [refreshTrigger, selectedTranscript]);

  const handleTranscriptionComplete = (newDoc: any) => {
    if (newDoc.status === 'completed') {
      setSelectedTranscript(newDoc);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUpdateTranscript = (updatedDoc: any) => {
    setSelectedTranscript(updatedDoc);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetLogs = async () => {
    if (!confirm('Are you sure you want to clear transcription logs? This will delete all database entries.')) {
      return;
    }
    setIsResetting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/transcripts`);
      if (response.ok) {
        const list = await response.json();
        for (const item of list) {
          await fetch(`${baseUrl}/api/transcripts/${item._id}`, {
            method: 'DELETE',
          });
        }
      }
      setSelectedTranscript(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleShareDashboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Dashboard console URL copied to clipboard!');
  };

  // Convert bytes to MB cleanly
  const storageUsedMB = parseFloat((storageUsedBytes / (1024 * 1024)).toFixed(2));
  const storagePercent = Math.min(Math.round((storageUsedBytes / maxStorageBytes) * 100), 100);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background text-[#191919] select-none overflow-hidden font-sans">
      {/* Premium Header */}
      <header className="px-6 py-4 bg-[#F5F2EB]/80 border-b border-[#E8E2D9] backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-8.5 w-8.5 rounded-xl bg-brand-indigo flex items-center justify-center text-white shadow-sm shadow-brand-indigo/10">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-[#191919]">
                VIBESCRIBE
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo font-bold tracking-widest uppercase">
                CONSOLE.V1
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5">speech processing studio</p>
          </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-3.5">
          <div className="hidden lg:flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-600">
              <Cpu className="h-3.5 w-3.5 text-brand-indigo" />
              ENGINE: {sttEngine.toUpperCase()}
            </span>
            <span className="flex items-center gap-1.5 bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-600">
              <Database className="h-3.5 w-3.5 text-brand-cyan" />
              CACHE: ACTIVE
            </span>
          </div>

          <div className="h-4.5 w-[1px] bg-[#E8E2D9] hidden lg:block"></div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleResetLogs}
              variant="outline"
              size="sm"
              isLoading={isResetting}
              className="text-[10px] gap-1.5 px-3 h-8 rounded-lg font-mono border-[#E8E2D9] hover:bg-[#F5F2EB]/60 bg-white text-[#191919]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Console
            </Button>

            <Button
              onClick={handleShareDashboard}
              variant="outline"
              size="sm"
              className="text-[10px] gap-1.5 px-3 h-8 rounded-lg font-mono border-[#E8E2D9] hover:bg-[#F5F2EB]/60 bg-white text-[#191919]"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>

          <div className="h-4.5 w-[1px] bg-[#E8E2D9]"></div>

          {/* System status light */}
          <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#E8E2D9] text-[10px] font-mono text-[#191919]">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan shadow-[0_0_6px_rgba(74,124,89,0.6)] animate-pulse"></span>
            SYS: ONLINE
          </span>
        </div>
      </header>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">
        {/* Sidebar Left: Transcript History */}
        <aside className="w-80 border-r border-[#E8E2D9] bg-[#F5F2EB]/30 p-5 hidden md:flex md:flex-col shrink-0 min-h-0">
          <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" /> Logs Database
          </h3>
          <div className="flex-1 min-h-0">
            <TranscriptList
              activeId={selectedTranscript?._id || null}
              onSelect={setSelectedTranscript}
              refreshTrigger={refreshTrigger}
              onDeleteActive={() => setSelectedTranscript(null)}
            />
          </div>
        </aside>

        {/* Primary Content workspace */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 scrollbar-thin">
          <div className="max-w-5xl w-full mx-auto flex flex-col h-full min-h-0">
            {selectedTranscript ? (
              <div className="flex-1 flex flex-col min-h-0 bg-transparent relative">
                {/* Back Link Header */}
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    onClick={() => setSelectedTranscript(null)}
                    variant="ghost"
                    size="sm"
                    className="rounded-lg gap-1.5 px-3 py-1 h-8 text-[11px] text-slate-600 hover:text-[#191919] bg-[#F5F2EB]/30 hover:bg-[#F5F2EB]/60 border border-[#E8E2D9]"
                  >
                    <ArrowLeft className="h-4 w-4" /> Return to Dashboard
                  </Button>
                  
                  <span className="text-[10px] font-mono text-slate-400">
                    RECORD_ID: {selectedTranscript._id}
                  </span>
                </div>
                
                {/* Viewer Card */}
                <Card className="flex-1 flex flex-col p-6 min-h-0">
                  <div className="flex-1 min-h-0">
                    <TranscriptViewer
                      transcript={selectedTranscript}
                      onUpdate={handleUpdateTranscript}
                    />
                  </div>
                </Card>
              </div>
            ) : (
              // Welcome Panel & Input Dashboard
              <div className="space-y-6 flex-1 min-h-0">
                {/* Stats Dashboard */}
                <StatsDashboard refreshTrigger={refreshTrigger} />

                {/* Transcription Terminal */}
                <div className="w-full">
                  <Card className="w-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-[#E8E2D9]">
                      <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Disc className="h-4.5 w-4.5 text-brand-indigo" /> Speech Terminal
                      </CardTitle>
                      
                      {/* Console Tab Toggles */}
                      <div className="flex bg-[#F5F2EB] p-1 rounded-xl border border-[#E8E2D9]">
                        <button
                          onClick={() => setActiveTab('record')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'record'
                              ? 'bg-brand-indigo text-white shadow-sm'
                              : 'text-slate-500 hover:text-[#191919] hover:bg-white/40'
                          }`}
                        >
                          <Mic className="h-3.5 w-3.5" /> Live Record
                        </button>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'upload'
                              ? 'bg-brand-indigo text-white shadow-sm'
                              : 'text-slate-500 hover:text-[#191919] hover:bg-white/40'
                          }`}
                        >
                          <UploadCloud className="h-3.5 w-3.5" /> Upload File
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col justify-center">
                      {activeTab === 'record' ? (
                        <AudioRecorder 
                          onTranscriptionComplete={handleTranscriptionComplete}
                          sttEngine={sttEngine}
                          language={sttLanguage}
                          diarization={diarization}
                          punctuation={punctuation}
                        />
                      ) : (
                        <AudioUploader 
                          onTranscriptionComplete={handleTranscriptionComplete}
                          sttEngine={sttEngine}
                          language={sttLanguage}
                          diarization={diarization}
                          punctuation={punctuation}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile list panel */}
                <Card className="flex-1 md:hidden min-h-[300px] flex flex-col p-5">
                  <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-slate-405" /> Recent Transcripts
                  </h3>
                  <div className="flex-1 overflow-y-auto">
                    <TranscriptList
                      activeId={selectedTranscript?._id || null}
                      onSelect={setSelectedTranscript}
                      refreshTrigger={refreshTrigger}
                      onDeleteActive={() => setSelectedTranscript(null)}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

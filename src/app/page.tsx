'use client';

import React, { useState } from 'react';
import { Mic, UploadCloud, History, LayoutDashboard, Volume2, ArrowLeft } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-screen max-h-screen bg-zinc-950 text-zinc-50 select-none">
      {/* Minimal Header */}
      <header className="px-6 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-zinc-100 flex items-center justify-center text-zinc-950">
            <Volume2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider uppercase text-zinc-100">VibeScribe</h1>
            <p className="text-[9px] text-zinc-500 font-mono tracking-wider mt-0.5">console.v1</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 tracking-wider">
          <span className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            SYS: ONLINE
          </span>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar Left */}
        <aside className="w-72 border-r border-zinc-800 bg-zinc-900/50 p-4 hidden md:flex md:flex-col shrink-0 min-h-0">
          <h3 className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-zinc-400" /> Logs history
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

        {/* Workspace Right */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0 bg-zinc-950 scrollbar-thin">
          <div className="max-w-3xl w-full mx-auto flex flex-col h-full min-h-0 space-y-5">
            
            {selectedTranscript ? (
              <Card className="flex-1 flex flex-col p-5 min-h-0 border-zinc-800 bg-zinc-900 relative">
                <div className="absolute top-5 left-5 z-10 md:hidden">
                  <Button
                    onClick={() => setSelectedTranscript(null)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-7 w-7 flex items-center justify-center rounded hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-3">
                  <Button
                    onClick={() => setSelectedTranscript(null)}
                    variant="ghost"
                    size="sm"
                    className="rounded gap-1.5 px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Console
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <TranscriptViewer
                    transcript={selectedTranscript}
                    onUpdate={handleUpdateTranscript}
                  />
                </div>
              </Card>
            ) : (
              // Welcome Panel & Input Dashboard
              <div className="grid grid-cols-1 gap-5 flex-1 min-h-0">
                {/* Stats */}
                <div className="shrink-0">
                  <StatsDashboard refreshTrigger={refreshTrigger} />
                </div>

                {/* Console */}
                <Card className="border-zinc-800 bg-zinc-900 shrink-0">
                  <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-zinc-850">
                    <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <LayoutDashboard className="h-4 w-4 text-zinc-500" /> Transcribe Desk
                    </CardTitle>
                    
                    {/* Toggle */}
                    <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                      <button
                        onClick={() => setActiveTab('record')}
                        className={`px-3 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors duration-150 flex items-center gap-1 ${
                          activeTab === 'record'
                            ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Mic className="h-3 w-3" /> Record
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-3 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors duration-150 flex items-center gap-1 ${
                          activeTab === 'upload'
                            ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <UploadCloud className="h-3 w-3" /> Upload
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    {activeTab === 'record' ? (
                      <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                    ) : (
                      <AudioUploader onTranscriptionComplete={handleTranscriptionComplete} />
                    )}
                  </CardContent>
                </Card>

                {/* Mobile log panel */}
                <Card className="flex-1 md:hidden border-zinc-800 bg-zinc-900 min-h-[280px] flex flex-col p-4">
                  <h3 className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> Recent logs
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

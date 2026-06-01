'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Activity, Clock, FileText, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';

interface Stats {
  totalCount: number;
  totalDuration: number;
  totalWords: number;
  averageWords: number;
}

export const StatsDashboard = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [stats, setStats] = useState<Stats>({
    totalCount: 0,
    totalDuration: 0,
    totalWords: 0,
    averageWords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/transcripts`);
        if (response.ok) {
          const data = await response.json();
          const count = data.length;
          
          let duration = 0;
          let words = 0;

          data.forEach((item: any) => {
            if (item.status === 'completed') {
              duration += item.duration || 0;
              words += item.wordCount || 0;
            }
          });

          setStats({
            totalCount: count,
            totalDuration: duration,
            totalWords: words,
            averageWords: count > 0 ? Math.round(words / count) : 0,
          });
        }
      } catch (err) {
        console.error('Failed to calculate stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="h-44 flex items-center justify-center">
        <svg className="animate-spin h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dynamic Header */}
      <div className="text-left">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-zinc-300" /> VibeScribe Console
        </h2>
        <p className="text-xs text-zinc-450 mt-1 font-light leading-relaxed">
          Minimalist speech transcription tool. Records browser audio input or processes uploaded audio files via hosted AI models.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-zinc-950 rounded border border-zinc-850 text-zinc-400">
              <Mic className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Recordings</p>
              <h3 className="text-lg font-bold text-zinc-200 mt-0.5">{stats.totalCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-zinc-950 rounded border border-zinc-850 text-zinc-400">
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Duration</p>
              <h3 className="text-lg font-bold text-zinc-200 mt-0.5">
                {formatDuration(stats.totalDuration)}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-zinc-950 rounded border border-zinc-850 text-zinc-400">
              <FileText className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Avg Words</p>
              <h3 className="text-lg font-bold text-zinc-200 mt-0.5">{stats.averageWords}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Alert */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-left flex items-start gap-3 shadow-sm">
        <div className="p-1.5 bg-zinc-900 rounded text-zinc-400 border border-zinc-800 shrink-0">
          <Database className="h-4.5 w-4.5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-300">Database Layer Status: Online</h4>
          <p className="text-[11px] text-zinc-500 font-light mt-1 leading-relaxed">
            Connected via mongoose cache to native MongoDB cluster. File operations synchronize with disk writes.
          </p>
        </div>
      </div>
    </div>
  );
};
export default StatsDashboard;

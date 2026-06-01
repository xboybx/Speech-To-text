'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, RefreshCw, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcript: any) => void;
}

export const AudioRecorder = ({ onTranscriptionComplete }: AudioRecorderProps) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio Visualizer refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    drawIdleLine();
    return () => {
      stopTimer();
      stopVisualizer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const drawIdleLine = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#27272a'; // zinc-800
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);

      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      drawFrequencyBars();
    } catch (err) {
      console.error('Failed to initialize visualizer:', err);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const drawFrequencyBars = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (recordingState !== 'recording' && recordingState !== 'paused') {
        stopVisualizer();
        drawIdleLine();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 40;
      const spacing = 3;
      const totalSpacing = spacing * (numBars - 1);
      const barWidth = (canvas.width - totalSpacing) / numBars;
      let x = 0;

      for (let i = 0; i < numBars; i++) {
        // Extract frequency data value
        const value = dataArray[i] || 0;
        const percent = value / 255.0;
        const barHeight = Math.max(2, percent * (canvas.height - 12));

        // Centered vertically
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = recordingState === 'recording' ? '#fafafa' : '#71717a'; // White when live, gray when paused
        ctx.fillRect(x, y, barWidth, barHeight);

        x += barWidth + spacing;
      }
    };

    draw();
  };

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    audioChunksRef.current = [];
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);

      setRecordingState('recording');
      startTimer();
      startVisualizer(stream);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Microphone access denied. Please grant permission.');
      setRecordingState('idle');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      startTimer();
      if (streamRef.current) {
        startVisualizer(streamRef.current);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      stopTimer();
      stopVisualizer();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const resetRecorder = () => {
    stopTimer();
    stopVisualizer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRecordingState('idle');
    setDuration(0);
    setAudioUrl(null);
    setError(null);
    setTimeout(() => drawIdleLine(), 50);
  };

  const handleTranscribe = async () => {
    if (!audioChunksRef.current.length) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('duration', duration.toString());
      formData.append('title', `Voice Memo ${new Date().toLocaleDateString()}`);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio.');
      }

      const result = await response.json();
      onTranscriptionComplete(result);
      resetRecorder();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during transcription.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Minimal Visualizer Canvas */}
      <div className="relative w-full h-32 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden mb-6 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={650}
          height={128}
        />
        
        {recordingState === 'idle' && (
          <div className="absolute top-3 left-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider z-10">
            Console Idle
          </div>
        )}

        {recordingState === 'recording' && (
          <div className="absolute top-3 left-4 text-[10px] font-mono text-zinc-200 uppercase tracking-wider z-10 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse-red"></span>
            Live Recording
          </div>
        )}

        {recordingState === 'paused' && (
          <div className="absolute top-3 left-4 text-[10px] font-mono text-zinc-500 uppercase tracking-wider z-10">
            Paused
          </div>
        )}

        {recordingState === 'stopped' && (
          <div className="absolute top-3 left-4 text-[10px] font-mono text-zinc-400 uppercase tracking-wider z-10">
            Audio Buffer Ready
          </div>
        )}

        {/* Digital Time */}
        {(recordingState === 'recording' || recordingState === 'paused' || recordingState === 'stopped') && (
          <div className="absolute bottom-3 right-4 font-mono text-xs text-zinc-400 z-10 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {error && (
        <div className="w-full p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-200 text-xs mb-5 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Console */}
      <div className="flex items-center gap-3 justify-center">
        {recordingState === 'idle' && (
          <Button onClick={startRecording} variant="primary" className="rounded-lg gap-2 px-5 py-2 text-xs">
            <Mic className="h-4 w-4" /> Start Recording
          </Button>
        )}

        {recordingState === 'recording' && (
          <>
            <Button onClick={pauseRecording} variant="secondary" className="rounded-lg gap-1.5 px-4 text-xs">
              Pause
            </Button>
            <Button onClick={stopRecording} variant="danger" className="rounded-lg gap-1.5 px-4 text-xs">
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
          </>
        )}

        {recordingState === 'paused' && (
          <>
            <Button onClick={resumeRecording} variant="primary" className="rounded-lg gap-1.5 px-4 text-xs">
              Resume
            </Button>
            <Button onClick={stopRecording} variant="danger" className="rounded-lg gap-1.5 px-4 text-xs">
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
          </>
        )}

        {recordingState === 'stopped' && (
          <div className="flex items-center gap-3">
            {audioUrl && (
              <audio src={audioUrl} controls className="h-8 max-w-[210px] border border-zinc-850 rounded" />
            )}
            
            <Button
              onClick={handleTranscribe}
              isLoading={isTranscribing}
              variant="primary"
              className="rounded-lg px-4 text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Transcribe
            </Button>

            <Button
              onClick={resetRecorder}
              variant="outline"
              className="rounded-lg p-2 h-8 w-8 flex items-center justify-center"
              title="Discard & Reset"
            >
              <RefreshCw className="h-3.5 w-3.5 text-zinc-550 hover:text-zinc-200" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
export default AudioRecorder;

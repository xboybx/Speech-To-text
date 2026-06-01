'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, RefreshCw, Upload, AlertCircle, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcript: any) => void;
  sttEngine?: 'deepgram' | 'whisper';
  language?: string;
  diarization?: boolean;
  punctuation?: boolean;
}

export const AudioRecorder = ({ 
  onTranscriptionComplete,
  sttEngine = 'deepgram',
  language = 'en',
  diarization = true,
  punctuation = true
}: AudioRecorderProps) => {
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
    
    // Draw subtle wave patterns representing idle console
    ctx.strokeStyle = 'rgba(232, 226, 217, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const centerY = canvas.height / 2;
    ctx.moveTo(0, centerY);
    
    // Create a very subtle static wave line
    for (let x = 0; x < canvas.width; x++) {
      const angle = (x / canvas.width) * Math.PI * 4;
      const y = centerY + Math.sin(angle) * 1.5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw idle VU Level Meters on both edges
    const drawIdleVU = (xPos: number) => {
      const segWidth = 6;
      const segHeight = 4;
      const segSpacing = 3;
      const totalHeight = (segHeight + segSpacing) * 12;
      const startY = (canvas.height - totalHeight) / 2;
      
      ctx.fillStyle = 'rgba(232, 226, 217, 0.8)';
      for (let j = 0; j < 12; j++) {
        const yPos = canvas.height - startY - (j * (segHeight + segSpacing)) - segHeight;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(xPos, yPos, segWidth, segHeight, 1);
        } else {
          ctx.rect(xPos, yPos, segWidth, segHeight);
        }
        ctx.fill();
      }
    };

    drawIdleVU(20);
    drawIdleVU(canvas.width - 26);
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

      // 1. Draw central frequency wave capsules
      const numBars = 45;
      const spacing = 4;
      const totalSpacing = spacing * (numBars - 1);
      const barWidth = (canvas.width - totalSpacing - 80) / numBars; // reserve space for VU meters on sides
      let x = 40; // start after left VU meter

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#D97756'); // Terracotta clay
      gradient.addColorStop(1, '#E8A382'); // Peach

      const mutedGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      mutedGradient.addColorStop(0, '#E8E2D9');
      mutedGradient.addColorStop(1, '#D8D2C9');

      ctx.fillStyle = recordingState === 'recording' ? gradient : mutedGradient;

      for (let i = 0; i < numBars; i++) {
        const value = dataArray[i] || 0;
        const percent = value / 255.0;
        const barHeight = Math.max(3, percent * (canvas.height - 24));
        const y = (canvas.height - barHeight) / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 99);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        x += barWidth + spacing;
      }

      // 2. Draw dual vertical LED Level meters on edges
      let sum = 0;
      for (let i = 0; i < 16; i++) {
        sum += dataArray[i] || 0;
      }
      const averageVolume = sum / (16 * 255);
      const activeSegments = Math.round(averageVolume * 12);

      const drawVUMeter = (xPos: number) => {
        const segWidth = 6;
        const segHeight = 4;
        const segSpacing = 3;
        const totalHeight = (segHeight + segSpacing) * 12;
        const startY = (canvas.height - totalHeight) / 2;

        for (let j = 0; j < 12; j++) {
          const isLit = j < activeSegments && recordingState === 'recording';
          let color = 'rgba(232, 226, 217, 0.8)'; // unlit segment

          if (isLit) {
            if (j < 7) color = '#4A7C59'; // Soft green (Normal levels)
            else if (j < 10) color = '#D97756'; // Clay (Moderate levels)
            else color = '#B91C1C'; // Red (Clip levels)
          }

          ctx.fillStyle = color;
          const yPos = canvas.height - startY - (j * (segHeight + segSpacing)) - segHeight;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(xPos, yPos, segWidth, segHeight, 1);
          } else {
            ctx.rect(xPos, yPos, segWidth, segHeight);
          }
          ctx.fill();
        }
      };

      drawVUMeter(20); // Left VU Meter
      drawVUMeter(canvas.width - 26); // Right VU Meter
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
      setError(err.message || 'Microphone access denied. Please grant permission in browser settings.');
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

      // Pass configuration states
      formData.append('engine', sttEngine);
      formData.append('language', language);
      formData.append('diarization', diarization ? 'true' : 'false');
      formData.append('punctuation', punctuation ? 'true' : 'false');

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
      {/* Premium Visualizer Panel */}
      <div className="relative w-full h-36 rounded-2xl bg-white border border-[#E8E2D9] overflow-hidden mb-6 flex items-center justify-center shadow-inner">
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full visualizer-glow opacity-80"
          width={580}
          height={144}
        />
        
        {/* Status indicators */}
        <div className="absolute top-4 left-5 z-10 text-[#191919]">
          {recordingState === 'idle' && (
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 font-semibold">
              <span className="h-2 w-2 rounded-full bg-slate-300"></span>
              Console Ready
            </div>
          )}

          {recordingState === 'recording' && (
            <div className="text-[10px] font-mono text-brand-pink uppercase tracking-widest flex items-center gap-2 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-pink animate-pulse-red"></span>
              Live Capturing
            </div>
          )}

          {recordingState === 'paused' && (
            <div className="text-[10px] font-mono text-amber-500 uppercase tracking-widest flex items-center gap-2 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-550 shadow-sm"></span>
              Capturing Paused
            </div>
          )}

          {recordingState === 'stopped' && (
            <div className="text-[10px] font-mono text-brand-indigo uppercase tracking-widest flex items-center gap-2 font-semibold">
              <span className="h-2 w-2 rounded-full bg-brand-indigo shadow-sm"></span>
              Buffer Rendered
            </div>
          )}
        </div>

        {/* Floating Digital Timeline */}
        {(recordingState === 'recording' || recordingState === 'paused' || recordingState === 'stopped') && (
          <div className="absolute bottom-4 right-5 font-mono text-[11px] text-slate-500 z-10 bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-bold">TIME:</span>
            <span className="font-bold text-[#191919]">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full p-4 rounded-xl bg-brand-pink/5 border border-brand-pink/20 text-brand-pink text-xs mb-5 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-brand-pink mt-0.5" />
          <div className="text-left font-light leading-relaxed">
            <span className="font-bold">Hardware Alert:</span> {error}
          </div>
        </div>
      )}

      {/* Control console */}
      <div className="flex items-center gap-4 justify-center w-full">
        {recordingState === 'idle' && (
          <Button 
            onClick={startRecording} 
            variant="primary" 
            className="rounded-xl gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider shadow-sm"
          >
            <Mic className="h-4.5 w-4.5" /> Start Recording
          </Button>
        )}

        {recordingState === 'recording' && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={pauseRecording} 
              variant="secondary" 
              className="rounded-xl gap-1.5 px-5 h-10 text-xs font-mono"
            >
              <Pause className="h-4 w-4 mr-0.5" /> Pause
            </Button>
            <Button 
              onClick={stopRecording} 
              variant="danger" 
              className="rounded-xl gap-1.5 px-5 h-10 text-xs font-mono uppercase tracking-wider"
            >
              <Square className="h-4 w-4 mr-0.5" /> Stop Capture
            </Button>
          </div>
        )}

        {recordingState === 'paused' && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={resumeRecording} 
              variant="primary" 
              className="rounded-xl gap-1.5 px-5 h-10 text-xs font-mono uppercase tracking-wider"
            >
              <Play className="h-4 w-4 mr-0.5 fill-white animate-pulse" /> Resume
            </Button>
            <Button 
              onClick={stopRecording} 
              variant="danger" 
              className="rounded-xl gap-1.5 px-5 h-10 text-xs font-mono uppercase tracking-wider"
            >
              <Square className="h-4 w-4 mr-0.5" /> Stop Capture
            </Button>
          </div>
        )}

        {recordingState === 'stopped' && (
          <div className="flex items-center gap-4 flex-wrap justify-center w-full max-w-md bg-[#F5F2EB]/50 border border-[#E8E2D9] p-3 rounded-2xl">
            {audioUrl && (
              <audio 
                src={audioUrl} 
                controls 
                className="h-8.5 max-w-[210px] outline-none rounded-lg border-0 bg-transparent text-xs text-[#191919]" 
              />
            )}
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTranscribe}
                isLoading={isTranscribing}
                variant="primary"
                className="rounded-xl px-5 h-9 text-xs font-mono uppercase tracking-wider"
              >
                <Sparkles className="h-4.5 w-4.5 mr-1.5 text-orange-100" /> Transcribe
              </Button>

              <Button
                onClick={resetRecorder}
                variant="outline"
                className="rounded-xl p-2.5 h-9 w-9 flex items-center justify-center border-[#E8E2D9] hover:bg-[#F5F2EB]/50"
                title="Discard & Reset"
              >
                <RefreshCw className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;

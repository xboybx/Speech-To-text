'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, AlertCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';

interface AudioUploaderProps {
  onTranscriptionComplete: (transcript: any) => void;
  sttEngine?: 'deepgram' | 'whisper';
  language?: string;
  diarization?: boolean;
  punctuation?: boolean;
}

const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-m4a', 'audio/m4a', 'audio/webm', 'audio/ogg', 'video/webm'];
const MAX_FILE_SIZE_MB = 25;

export const AudioUploader = ({ 
  onTranscriptionComplete,
  sttEngine = 'deepgram',
  language = 'en',
  diarization = true,
  punctuation = true
}: AudioUploaderProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateFile = (selectedFile: File): boolean => {
    setError(null);
    const sizeInMB = selectedFile.size / (1024 * 1024);
    if (sizeInMB > MAX_FILE_SIZE_MB) {
      setError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB maximum threshold allowed by the parser.`);
      return false;
    }

    const isSupportedType = SUPPORTED_FORMATS.includes(selectedFile.type);
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const isSupportedExtension = ['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(fileExtension || '');

    if (!isSupportedType && !isSupportedExtension) {
      setError('Unsupported file type. Please upload a standard MP3, WAV, M4A, WEBM, or OGG container.');
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUploadClick = () => {
    if (!file) {
      fileInputRef.current?.click();
    }
  };

  const resetUploader = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const cleanTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      formData.append('title', cleanTitle);

      // Pass configuration states to server API
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
      resetUploader();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during transcription processing.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Matte Dropzone Panel */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        className={`w-full p-8 rounded-2xl border border-dashed transition-all duration-300 flex flex-col items-center justify-center ${
          !file ? 'cursor-pointer' : ''
        } ${
          isDragActive
            ? 'border-brand-indigo bg-brand-indigo/5 shadow-sm'
            : file
            ? 'border-[#E8E2D9] bg-[#F5F2EB]/20'
            : 'border-[#E8E2D9] bg-white hover:bg-[#F5F2EB]/30 hover:border-[#D5CFC4]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {!file ? (
          <>
            <div className="p-3 bg-[#F5F2EB]/80 rounded-2xl border border-[#E8E2D9] mb-3 text-slate-500 shadow-sm">
              <UploadCloud className="h-6 w-6 text-brand-indigo" />
            </div>
            <p className="text-xs text-[#191919] font-semibold mb-1 text-center">
              Drag & drop audio files here, or <span className="text-brand-indigo underline hover:text-[#c66847] transition-colors">browse files</span>
            </p>
            <p className="text-[10px] text-slate-400 tracking-wider text-center uppercase font-mono mt-1">
              MP3, WAV, M4A, WEBM, OGG (MAX LIMIT {MAX_FILE_SIZE_MB}MB)
            </p>
          </>
        ) : (
          <div className="w-full flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap bg-[#F5F2EB]/30 border border-[#E8E2D9] p-3 rounded-xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 bg-brand-indigo/10 rounded-xl border border-brand-indigo/25 text-brand-indigo shrink-0">
                <FileAudio className="h-5 w-5" />
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-[#191919] truncate">{file.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatFileSize(file.size)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                onClick={handleTranscribe}
                isLoading={isTranscribing}
                variant="primary"
                size="sm"
                className="px-4.5 rounded-lg h-9 text-xs font-mono uppercase tracking-wider shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-orange-100" /> Transcribe
              </Button>
              
              {!isTranscribing && (
                <Button
                  onClick={resetUploader}
                  variant="outline"
                  size="sm"
                  className="rounded-lg p-2 h-9 w-9 flex items-center justify-center border-[#E8E2D9] hover:bg-[#F5F2EB]/50 bg-white"
                  title="Remove File"
                >
                  <X className="h-4 w-4 text-slate-500 hover:text-[#191919]" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full p-4 rounded-xl bg-brand-pink/5 border border-brand-pink/20 text-brand-pink text-xs mt-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-brand-pink mt-0.5" />
          <div className="text-left font-light leading-relaxed">
            <span className="font-bold">Uploader Alert:</span> {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;

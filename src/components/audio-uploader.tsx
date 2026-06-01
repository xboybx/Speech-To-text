'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';

interface AudioUploaderProps {
  onTranscriptionComplete: (transcript: any) => void;
}

const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-m4a', 'audio/m4a', 'audio/webm', 'audio/ogg', 'video/webm'];
const MAX_FILE_SIZE_MB = 25;

export const AudioUploader = ({ onTranscriptionComplete }: AudioUploaderProps) => {
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
      setError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return false;
    }

    const isSupportedType = SUPPORTED_FORMATS.includes(selectedFile.type);
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const isSupportedExtension = ['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(fileExtension || '');

    if (!isSupportedType && !isSupportedExtension) {
      setError('Unsupported file format. Please upload MP3, WAV, M4A, WEBM, or OGG.');
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
      setError(err.message || 'Error occurred during transcription.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Minimal Matte Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        className={`w-full p-8 rounded-lg border border-dashed transition-colors duration-150 flex flex-col items-center justify-center ${
          !file ? 'cursor-pointer' : ''
        } ${
          isDragActive
            ? 'border-zinc-400 bg-zinc-900/40'
            : file
            ? 'border-zinc-800 bg-zinc-900/20'
            : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/30 hover:border-zinc-700'
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
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-850 mb-3 text-zinc-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-xs text-zinc-200 font-medium mb-1 text-center">
              Drag and drop audio file, or <span className="text-zinc-100 underline hover:text-white">browse</span>
            </p>
            <p className="text-[10px] text-zinc-500 tracking-wider text-center uppercase font-mono">
              MP3, WAV, M4A, WEBM, OGG (Max {MAX_FILE_SIZE_MB}MB)
            </p>
          </>
        ) : (
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-300 shrink-0">
                <FileAudio className="h-5 w-5" />
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-zinc-200 truncate">{file.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatFileSize(file.size)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTranscribe}
                isLoading={isTranscribing}
                variant="primary"
                size="sm"
                className="px-4 rounded-md h-8 text-xs"
              >
                Transcribe
              </Button>
              
              {!isTranscribing && (
                <Button
                  onClick={resetUploader}
                  variant="secondary"
                  size="sm"
                  className="rounded-md p-1.5 h-8 w-8 flex items-center justify-center"
                  title="Remove file"
                >
                  <X className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-200 text-xs mt-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
export default AudioUploader;

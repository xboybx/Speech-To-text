import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITranscript extends Document {
  title: string;
  transcription: string;
  audioUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  mimeType: string;
  language: string;
  wordCount: number;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema = new Schema<ITranscript>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    transcription: {
      type: String,
      default: '',
    },
    audioUrl: {
      type: String,
      required: [true, 'Audio URL is required'],
    },
    duration: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    language: {
      type: String,
      default: 'en',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Text index for search on title and transcription content
TranscriptSchema.index(
  { title: 'text', transcription: 'text' },
  { weights: { title: 10, transcription: 2 }, name: 'TranscriptTextSearchIndex' }
);

// Reverse chronological sort index
TranscriptSchema.index({ createdAt: -1 });

// Pre-save hook to calculate word count
TranscriptSchema.pre<ITranscript>('save', function () {
  if (this.isModified('transcription')) {
    if (this.transcription) {
      this.wordCount = this.transcription.trim().split(/\s+/).filter(Boolean).length;
    } else {
      this.wordCount = 0;
    }
  }
});

const Transcript: Model<ITranscript> =
  mongoose.models.Transcript || mongoose.model<ITranscript>('Transcript', TranscriptSchema);

export default Transcript;

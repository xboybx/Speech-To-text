import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/lib/db';
import Transcript from '@/models/Transcript';
import { SpeechToTextService } from '@/lib/stt-service';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || `Recording ${new Date().toLocaleString()}`;
    const duration = parseFloat((formData.get('duration') as string) || '0');

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Prepare upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.name) || '.webm';
    const fileName = `audio_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file buffer to local disk
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const audioUrl = `/uploads/${fileName}`;

    // Create preliminary transcription record in database
    const transcriptDoc = await Transcript.create({
      title,
      audioUrl,
      fileSize: file.size,
      mimeType: file.type || 'audio/webm',
      duration,
      status: 'processing',
    });

    try {
      // Execute the speech-to-text API call
      const { text, language } = await SpeechToTextService.transcribeAudio(
        filePath,
        file.type || 'audio/webm'
      );

      // Save transcription results on success
      transcriptDoc.transcription = text;
      transcriptDoc.language = language || 'en';
      transcriptDoc.status = 'completed';
      await transcriptDoc.save();

      return NextResponse.json(transcriptDoc, { status: 201 });
    } catch (sttError: any) {
      console.error('STT Processing failed:', sttError);
      transcriptDoc.status = 'failed';
      transcriptDoc.errorMessage = sttError.message || 'Speech-to-Text api transcription failed';
      await transcriptDoc.save();
      return NextResponse.json(transcriptDoc, { status: 201 });
    }
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

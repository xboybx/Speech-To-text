import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import dbConnect from '@/lib/db';
import Transcript from '@/models/Transcript';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const transcript = await Transcript.findById(id);
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    return NextResponse.json(transcript, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const transcript = await Transcript.findById(id);
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    // Update permissible fields (title, transcription)
    if (body.title !== undefined) transcript.title = body.title;
    if (body.transcription !== undefined) {
      transcript.transcription = body.transcription;
    }

    await transcript.save();
    return NextResponse.json(transcript, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const transcript = await Transcript.findById(id);
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    // Unlink the local audio file if it is stored locally
    if (transcript.audioUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', transcript.audioUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Failed to delete audio file from disk:', fileError);
        }
      }
    }

    await Transcript.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Transcript deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

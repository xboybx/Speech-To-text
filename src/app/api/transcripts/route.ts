import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transcript from '@/models/Transcript';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get('search');

    let filter = {};
    if (searchQuery) {
      filter = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { transcription: { $regex: searchQuery, $options: 'i' } },
        ],
      };
    }

    const transcripts = await Transcript.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(transcripts, { status: 200 });
  } catch (error: any) {
    console.error('List Transcripts Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

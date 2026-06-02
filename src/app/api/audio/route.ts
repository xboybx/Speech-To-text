import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Fetch the private blob using @vercel/blob get()
    // It will automatically use the BLOB_READ_WRITE_TOKEN from env
    const blobResponse = await get(url, { access: 'private' });
    if (!blobResponse || blobResponse.statusCode !== 200) {
      return NextResponse.json({ error: 'Failed to retrieve blob' }, { status: 404 });
    }
    
    // Stream it back to the client with the correct content type
    return new NextResponse(blobResponse.stream as any, {
      headers: {
        'Content-Type': blobResponse.blob.contentType || 'audio/webm',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Audio proxy error:', error);
    return NextResponse.json({ error: error.message || 'Failed to stream audio' }, { status: 500 });
  }
}

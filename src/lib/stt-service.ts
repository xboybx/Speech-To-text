import fs from 'fs';
import { DeepgramClient } from '@deepgram/sdk';
import OpenAI from 'openai';

interface TranscriptionResult {
  text: string;
  language?: string;
}

export class SpeechToTextService {
  private static getProvider(): 'deepgram' | 'whisper' {
    const provider = process.env.STT_PROVIDER || 'deepgram';
    if (provider !== 'deepgram' && provider !== 'whisper') {
      throw new Error(`Unsupported Speech-to-Text provider: "${provider}"`);
    }
    return provider;
  }

  public static async transcribeAudio(
    filePath: string,
    mimeType: string
  ): Promise<TranscriptionResult> {
    const provider = this.getProvider();

    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found at path: ${filePath}`);
    }

    if (provider === 'deepgram') {
      return this.transcribeWithDeepgram(filePath, mimeType);
    } else {
      return this.transcribeWithWhisper(filePath);
    }
  }

  private static async transcribeWithDeepgram(
    filePath: string,
    mimeType: string
  ): Promise<TranscriptionResult> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY is not defined in environment variables.');
    }

    // Initialize using the new v5 DeepgramClient class
    const deepgram = new DeepgramClient({ apiKey });
    const audioBuffer = fs.readFileSync(filePath);

    // Call v1 media transcribe endpoint
    const response = await deepgram.listen.v1.media.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        smart_format: true,
        mimetype: mimeType,
      }
    );

    const res = response as any;
    const channel = res.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const text = alternative?.transcript || '';
    
    // Attempt to extract language if detected, fallback to 'en'
    const language = res.metadata?.languages?.[0] || 'en';

    return { text, language };
  }

  private static async transcribeWithWhisper(filePath: string): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables.');
    }

    const openai = new OpenAI({ apiKey });
    
    const fileStream = fs.createReadStream(filePath);
    
    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    });

    return {
      text: response.text || '',
      language: response.language || 'en',
    };
  }
}

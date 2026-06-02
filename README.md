# 🎙️ VibeScribe — Obsidian STT Developer Console

VibeScribe is a high-contrast, flat matte dark-mode developer console built with Next.js 16+ and React 19. It provides an efficient browser interface for recording microphone audio or uploading pre-recorded audio files, transcribing them with state-of-the-art AI speech-to-text models (Deepgram Nova-2 and OpenAI Whisper-1), and storing them in MongoDB.

---

## 🚀 Key Features

* **Minimalist Obsidian-Zinc Aesthetic**: Flat obsidian-gray interface with solid borders, vertical frequency canvas visualizers, and code-aligned typography.
* **Recording Engine**: HTML5 `MediaRecorder` audio capture directly in the browser, featuring pause/resume, a real-time counter, and CSS canvas frequency visualizers.
* **File Uploader**: Drag-and-drop area accepting `.mp3`, `.wav`, `.m4a`, `.webm`, and `.ogg` formats with size verification.
* **Flexible STT Providers**: Class-based plug-and-play toggling of speech-to-text providers via a single environment variable (`STT_PROVIDER`). Fully integrated with:
  * **Deepgram Nova-2** (using the new `@deepgram/sdk` v5 Client)
  * **OpenAI Whisper-1** (using the official `openai` SDK with Node.js ReadStream wrapper)
* **Search & History**: Left-sidebar list displaying full history, inline title editing, and regex-powered full-text search across titles and transcripts.
* **Cascading Cleanup**: Deleting a record from MongoDB automatically performs a non-blocking cleanup of its associated audio file in Vercel Blob (with legacy compatibility for unlinking local uploads).
* **Document Exporter**: View transcripts in a monospace developer reviewer, copy text to the clipboard with one click, or export to Plain Text (`.txt`) and JSON format.

---

## 🛠️ Technology Stack

| Technology | Layer | Purpose |
| :--- | :--- | :--- |
| **Next.js 16+ (App Router)** | Fullstack Framework | Client side pages, components, & Serverless API Routes |
| **React 19** | Component Library | Reactive state management, layout rendering |
| **Tailwind CSS v4** | Styling Framework | Clean utility-first styling with custom matte themes |
| **MongoDB / Mongoose** | Database & ORM | Storage layer with global connection client caching and text search indexing |
| **Framer Motion** | Animation | Micro-animations, page slide transitions, and smooth hover effects |
| **MediaRecorder API** | Web Audio API | Live browser recording of microphone input |
| **Lucide React** | Icons | Minimal, clean developer-oriented iconography |

---

## 📁 Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── api/            # Serverless API routes
│   │   │   ├── audio/      # Private Vercel Blob audio stream proxy
│   │   │   ├── transcribe/ # Upload / STT execution endpoint
│   │   │   └── transcripts/# CRUD and searching endpoints
│   │   ├── globals.css     # Global matte theme styles
│   │   ├── layout.tsx      # Main wrapper & metadata configuration
│   │   └── page.tsx        # VibeScribe Console workspace interface
│   ├── components/         # React Components
│   │   ├── audio-recorder.tsx   # Live recording panel + canvas visualizer
│   │   ├── audio-uploader.tsx   # File drag & drop workspace
│   │   ├── stats-dashboard.tsx  # Total transcripts, word counts, and durations
│   │   ├── transcript-list.tsx  # Sidebar historical lists with filters
│   │   ├── transcript-viewer.tsx# Text editing, download, and copy actions
│   │   └── ui/                  # Shared style primitives (buttons, cards, inputs)
│   ├── lib/
│   │   ├── db.ts           # Cached MongoDB/Mongoose connection client
│   │   └── stt-service.ts  # Modular Speech-to-Text wrapper class
│   └── models/
│       └── Transcript.ts   # Mongoose database schema and indexes
├── package.json            # Node dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js 18+** and a running instance of **MongoDB** (local or MongoDB Atlas).

### 2. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 3. Environment Setup
Create a `.env` (or `.env.local`) file in the root directory:
```bash
# Database Configuration
MONGODB_URI=mongodb://0.0.0.0:27017/speech-to-text

# Speech-to-Text Provider Toggle ('deepgram' or 'whisper')
STT_PROVIDER=deepgram

# Deepgram Credentials (Required if STT_PROVIDER=deepgram)
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# OpenAI Credentials (Required if STT_PROVIDER=whisper)
OPENAI_API_KEY=your_openai_api_key_here

# Vercel Blob Storage Token (Required for cloud storage upload)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_read_write_token_here
```

### 4. Running the App
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To build and run in production mode:
```bash
npm run build
npm start
```

---

## 📊 System Design & Data Flow

When a user triggers a transcription:
```
       +---------------------------------------------+
       |                  CLIENT UI                  |
       |  - React Components (App Router)            |
       |  - MediaRecorder API (Capture Audio)        |
       |  - Canvas Frequency Bar Visualizer          |
       |  - Tailwind CSS v4 Styling                  |
       +----------------------|----------------------+
                              |
                     HTTPS POST Requests
                     (FormData / JSON)
                              |
                              v
       +---------------------------------------------+
       |            NEXT.JS API ROUTE                |
       |  - App router routes (api/transcribe, etc)  |
       |  - Node.js environment                      |
       +-----------|--------------------|------------+
                    |                    |
         Uploads Raw Audio            Sends Audio
                    |                    |
                    v                    v
       +---------------------+   +-------------------+
       | VERCEL BLOB STORAGE |   |    AI STT API     |
       |  - Cloud Storage    |   |  - Deepgram Nova-2|
       +---------------------+   |  - OpenAI Whisper |
                                 +----------|--------+
                                            |
                                    Returns Text
                                            |
                    +------------------------v
                    |
                    v
       +---------------------------------------------+
       |              DATABASE LAYER                 |
       |  - Mongoose ORM / MongoDB Atlas             |
       |  - Saves transcripts, titles, metadata      |
       +---------------------------------------------+
```

### Ingestion Lifecycle Sequence
1. **Audio Submission**: User records or uploads audio. The client submits a `multipart/form-data` payload containing the file and optional metadata to `/api/transcribe`.
2. **Cloud Uploading**: The API route uploads the incoming file directly to Vercel Blob cloud storage using `@vercel/blob`'s `put()` method.
3. **STT Invocation**: The `STTService` detects the configured provider, forwards the in-memory `audioBuffer` directly to Deepgram or OpenAI (via `toFile`), and retrieves the text output.
4. **Database Insertion**: A Mongoose document is instantiated. The pre-save hook computes the total word count. The document is stored in MongoDB.
5. **Client Update & Playback**: The API returns the document JSON (201 Created). The client appends it to the sidebar list and plays back the audio via the `/api/audio` proxy which streams private blobs securely.

---

## 📡 API Endpoints

### `POST /api/transcribe`
Transcribes uploaded audio and saves metadata.
* **Payload**: `FormData`
  * `file`: Binary audio file
  * `title`: (Optional) Custom title
* **Response (201)**:
  ```json
  {
    "_id": "603d2b2f8f...4c",
    "title": "Recording 2026-06-01",
    "transcription": "Hello, this is a live test of VibeScribe.",
    "audioUrl": "https://xyz.public.blob.vercel-storage.com/audio_1716301292000.webm",
    "duration": 5.4,
    "fileSize": 104201,
    "mimeType": "audio/webm",
    "language": "en",
    "wordCount": 8,
    "status": "completed",
    "createdAt": "2026-06-01T04:15:30.000Z"
  }
  ```

### `GET /api/audio`
Streams private Vercel Blob audio files securely using server-side credentials to bypass CORS/Access restrictions in client players.
* **Query Params**:
  * `url`: The full private Vercel Blob storage URL.
* **Response (200)**: The audio binary data stream.

### `GET /api/transcripts`
List all transcripts sorted descending by `createdAt`. Supports text search.
* **Query Params**:
  * `search`: (Optional) String text query.
* **Response (200)**: Array of transcript documents.

### `GET /api/transcripts/[id]`
Retrieve details for a single transcript.

### `PATCH /api/transcripts/[id]`
Modify transcript content or title.
* **Payload**: `JSON` (e.g., `{ "title": "Updated Session Title", "transcription": "Corrected transcript text" }`)

### `DELETE /api/transcripts/[id]`
Deletes the Mongoose database entry and triggers a Vercel Blob `del()` API call to remove the file from cloud storage, with fallback to filesystem unlinking for legacy local files.

---

## 💾 Database Schema Details

The application utilizes a single primary schema `Transcript` inside MongoDB:

* **Weighted Text Search Index**: 
  We create a compound text index targeting `{ title: 'text', transcription: 'text' }`. The `title` is weighted at `10` and `transcription` is weighted at `2` to prioritize title matches during query searches.
* **Sorting Index**: 
  A single-field index on `{ createdAt: -1 }` guarantees sub-millisecond sorting times for chronological history listing.
* **Pre-save Lifecycle Hook**: 
  Before saving or updating, the schema automatically calculates and syncs the exact `wordCount` by splitting the trimmed transcription text using regex filters.

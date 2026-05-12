# SyncMaster

Audio Meta Tagging Engine - Desktop Application for Sync Licensing & Producers.

## Features
- **Drag & Drop**: Drop `.mp3` and `.wav` files directly into the UI.
- **Auto Analysis**: Uses local Python libraries to detect BPM, Key, and Genre.
- **Smart Tagging**: Automatically writes ID3 tags (BPM, Key, Genre, Title) for `.mp3`.
- **Auto Organizing**: Renames files to Industry Standard (`Title_BPM_Key_Genre.ext`) and moves them to `Organized/Genre` folders.
- **Duplicates Review**: Flags duplicates or files like `trippin (1).mp3` for manual review.

## Setup

### 1. Python Backend
The audio analysis relies on a local Python script using `librosa`.
You must have Python installed.
```powershell
cd python-engine
pip install -r requirements.txt
```

### 2. Frontend App
Install dependencies and run the Electron desktop app:
```powershell
npm install
npm run dev
```

## How It Works
1. When files are dropped, the Electron frontend passes their paths to the Node backend.
2. Node spawns the Python `analyzer.py` process to extract BPM, Key, and Genre.
3. Once data returns, Node uses `node-id3` to tag the file.
4. The file is renamed and moved into a new `Organized/<Genre>/` folder relative to where the file originally was.
5. The UI updates with the processed status and displays the metadata.

import os
import sys
import json
import sqlite3
import time
from mutagen import File as MutagenFile

def get_duration(path):
    try:
        audio = MutagenFile(path)
        if audio is not None and audio.info is not None:
            return audio.info.length
    except Exception:
        pass
    return 0

def scan_drives(target_root, db_path):
    MIN_DURATION = 60.0 # Minimum seconds requirement
    # Supported Audio Extensions ONLY
    AUDIO_EXTS = {'.mp3', '.wav', '.m4a'}
    
    # Skip known systemic noise directories to skyrocket speed
    EXCLUDE_DIRS = {
        'windows', 'program files', 'program files (x86)', 'appdata',
        'node_modules', '$recycle.bin', 'system volume information',
        '.git', '__pycache__', 'cache', 'logs'
    }

    # Setup Database connection with longer timeout for concurrency
    conn = sqlite3.connect(db_path, timeout=30.0)
    cursor = conn.cursor()
    
    # Enable WAL mode for multi-process reading/writing safety
    cursor.execute('PRAGMA journal_mode=WAL;')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audio_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filepath TEXT UNIQUE,
        filename TEXT,
        extension TEXT,
        filesize INTEGER,
        last_modified REAL,
        scanned_at REAL,
        bpm REAL,
        key TEXT,
        genre TEXT,
        has_vocals INTEGER
    )
    ''')
    # ABSOLUTELY CLEAR PREVIOUS RESIDUE BEFORE RE-INDEXING
    cursor.execute('DELETE FROM audio_files;')
    conn.commit()

    print(json.dumps({"status": "starting", "message": f"Initiating scan of {target_root}"}))
    sys.stdout.flush()

    found_count = 0
    skipped_count = 0
    
    batch_buffer = []
    batch_size = 1000

    start_time = time.time()

    try:
        for root, dirs, files in os.walk(target_root, topdown=True):
            # Prune systemic noise and DAW cache folders to ensure extreme clean indexing
            dirs[:] = [
                d for d in dirs 
                if d.lower() not in EXCLUDE_DIRS 
                and not d.startswith('.')
                and 'cache' not in d.lower()
                and 'vocalign' not in d.lower()
                and 'temp' not in d.lower()
            ]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in AUDIO_EXTS:
                    full_path = os.path.join(root, file)
                    try:
                        stat = os.stat(full_path)
                        # Pre-gate: If file is < 100KB, it's almost definitely not 60s long. 
                        # Skip to save mutagen file opening IO penalty.
                        if stat.st_size < 100000:
                            continue
                            
                        # Precise Duration Check
                        duration = get_duration(full_path)
                        if duration < MIN_DURATION:
                            continue

                        batch_buffer.append((
                            full_path,
                            file,
                            ext,
                            stat.st_size,
                            stat.st_mtime,
                            time.time()
                        ))
                        found_count += 1
                        
                        if len(batch_buffer) >= batch_size:
                            cursor.executemany('''
                                INSERT OR REPLACE INTO audio_files 
                                (filepath, filename, extension, filesize, last_modified, scanned_at)
                                VALUES (?, ?, ?, ?, ?, ?)
                            ''', batch_buffer)
                            conn.commit()
                            batch_buffer = []
                            print(json.dumps({"status": "progress", "count": found_count}))
                            sys.stdout.flush()
                    except Exception:
                        skipped_count += 1
    except KeyboardInterrupt:
        print(json.dumps({"status": "interrupted"}))
        sys.stdout.flush()
    
    # Flush final batch
    if batch_buffer:
        cursor.executemany('''
            INSERT OR REPLACE INTO audio_files 
            (filepath, filename, extension, filesize, last_modified, scanned_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', batch_buffer)
        conn.commit()

    conn.close()
    
    elapsed = time.time() - start_time
    print(json.dumps({
        "status": "complete", 
        "found": found_count, 
        "elapsed_seconds": round(elapsed, 2)
    }))
    sys.stdout.flush()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: scanner.py [RootPath] [DbPath]"}))
        sys.exit(1)
        
    scan_root = sys.argv[1]
    db_location = sys.argv[2]
    
    scan_drives(scan_root, db_location)

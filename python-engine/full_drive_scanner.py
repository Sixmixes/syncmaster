import os
import sys
import json
import sqlite3
import time

def scan_drives(target_root, db_path):
    # Supported Audio Extensions ONLY
    AUDIO_EXTS = {'.mp3', '.wav', '.m4a'}
    
    # Skip known systemic noise directories to skyrocket speed
    EXCLUDE_DIRS = {
        'windows', 'program files', 'program files (x86)', 'appdata',
        'node_modules', '$recycle.bin', 'system volume information',
        '.git', '__pycache__', 'cache', 'logs', 'dist', 'build',
        'src', 'projects', 'code', '.next', 'env', 'venv', '.venv', '.vscode', 'out'
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

    # Load dynamic, persistent custom exclusions registered by the operator
    dynamic_ignored_patterns = []
    try:
        cursor.execute('CREATE TABLE IF NOT EXISTS ignored_paths (id INTEGER PRIMARY KEY AUTOINCREMENT, pattern TEXT UNIQUE);')
        conn.commit()
        cursor.execute('SELECT pattern FROM ignored_paths;')
        dynamic_ignored_patterns = [row[0].lower().replace('/', '\\') for row in cursor.fetchall() if row[0]]
    except Exception as e:
        pass

    print(json.dumps({"status": "starting", "message": f"Initiating scan of {target_root}"}))
    sys.stdout.flush()

    found_count = 0
    skipped_count = 0
    
    batch_buffer = []
    batch_size = 1000

    start_time = time.time()

    try:
        for root, dirs, files in os.walk(target_root, topdown=True):
            # Real-time performance booster: Proactively prune custom user-ignored branches
            normalized_root = root.lower().replace('/', '\\')
            if any(pat in normalized_root for pat in dynamic_ignored_patterns):
                dirs[:] = []  # Instruct walk to instantly cease recursive deep searching down this stem
                continue

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
                        # Approximate Duration Check via sizing:
                        # 60s at 128kbps MP3 ~960KB. Let's block anything < 800KB (800,000 bytes) 
                        # to instantly drop small 1-shot drum hits without heavy IO headers logic.
                        if stat.st_size < 800000:
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

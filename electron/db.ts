import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

let db: sqlite3.Database | null = null;

export function getDbPath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'syncmaster_v2.db');
}

export function initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        const dbPath = getDbPath();
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Could not connect to database', err);
                return reject(err);
            }
            console.log('Connected to SQLite database at:', dbPath);
            
            db?.serialize(() => {
                // Enable concurrency handling for python bridge
                db?.run('PRAGMA journal_mode = WAL');
                db?.run('PRAGMA busy_timeout = 30000');

                db?.run(`
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
                `);
                
                db?.run(`CREATE INDEX IF NOT EXISTS idx_filename ON audio_files(filename)`);
                db?.run(`CREATE INDEX IF NOT EXISTS idx_genre ON audio_files(genre)`);
                resolve();
            });
        });
    });
}

export function searchAudio(query: string, genre?: string): Promise<{ results: any[], totalCount: number }> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        
        let baseSql = 'FROM audio_files WHERE 1=1';
        const params: any[] = [];
        
        if (query && query.trim()) {
            // Tokenize terms by spaces to replicate Everything engine multi-word filters
            const terms = query.trim().split(/\s+/).filter(Boolean);
            
            terms.forEach(term => {
                if (term.startsWith('.') && term.length > 1) {
                    // Exact extension extraction (e.g., .mp3, .wav)
                    baseSql += ' AND extension = ?';
                    params.push(term.toLowerCase());
                } else {
                    // Deep query spanning both logical paths and exact names
                    baseSql += ' AND (filename LIKE ? OR filepath LIKE ?)';
                    params.push(`%${term}%`, `%${term}%`);
                }
            });
        }
        
        if (genre) {
            baseSql += ' AND genre = ?';
            params.push(genre);
        }

        const countSql = `SELECT COUNT(*) as total ${baseSql}`;
        const rowsSql = `SELECT * ${baseSql} ORDER BY scanned_at DESC LIMIT 500`;
        
        db.get(countSql, params, (err, countRow: any) => {
            if (err) return reject(err);
            
            db!.all(rowsSql, params, (err, rows) => {
                if (err) return reject(err);
                resolve({
                    results: rows || [],
                    totalCount: countRow ? countRow.total : 0
                });
            });
        });
    });
}

export function getDatabaseInstance() {
    return db;
}

export function findAcapellas(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        
        // Targeted SQL regex approximation using logical OR wildcard tokens
        // Ensures standard exclusions (like Studio One, DAW Exports)
        const query = `
            SELECT * FROM audio_files 
            WHERE (
                LOWER(filename) LIKE '%acapella%' 
                OR LOWER(filename) LIKE '%vocal%' 
                OR LOWER(filename) LIKE '% vox%'
                OR LOWER(filename) LIKE '%pella%'
            )
            AND filepath NOT LIKE '%Studio One%'
            AND filepath NOT LIKE '%StudioOne%'
            AND filepath NOT LIKE '%Cache%'
            ORDER BY scanned_at DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export function clearDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        db.run('DELETE FROM audio_files', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export function updateAudioMetadata(id: number, data: { bpm: number, key: string, genre: string, has_vocals: boolean }): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const sql = `UPDATE audio_files SET bpm = ?, key = ?, genre = ?, has_vocals = ? WHERE id = ?`;
        db.run(sql, [data.bpm, data.key, data.genre, data.has_vocals ? 1 : 0, id], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

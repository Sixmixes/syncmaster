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
                        has_vocals INTEGER,
                        mood TEXT,
                        energy INTEGER,
                        danceability INTEGER,
                        viral_score INTEGER,
                        type TEXT
                    )
                `);

                // Dynamic, self-healing migrations for schema upgrade v2.1
                db?.run("ALTER TABLE audio_files ADD COLUMN mood TEXT", () => {});
                db?.run("ALTER TABLE audio_files ADD COLUMN energy INTEGER", () => {});
                db?.run("ALTER TABLE audio_files ADD COLUMN danceability INTEGER", () => {});
                db?.run("ALTER TABLE audio_files ADD COLUMN viral_score INTEGER", () => {});
                db?.run("ALTER TABLE audio_files ADD COLUMN type TEXT", () => {});
                
                db?.run(`CREATE INDEX IF NOT EXISTS idx_filename ON audio_files(filename)`);
                db?.run(`CREATE INDEX IF NOT EXISTS idx_genre ON audio_files(genre)`);

                // 1. Establish FTS5 Virtual Table for instant substring/word lookup
                db?.run(`
                    CREATE VIRTUAL TABLE IF NOT EXISTS audio_fts USING fts5(
                        filename, 
                        filepath, 
                        content='audio_files', 
                        content_rowid='id'
                    )
                `);

                // 2. Establish synchronization triggers ensuring index parity with active modifications
                db?.run(`
                    CREATE TRIGGER IF NOT EXISTS audio_ai AFTER INSERT ON audio_files BEGIN
                        INSERT INTO audio_fts(rowid, filename, filepath) VALUES (new.id, new.filename, new.filepath);
                    END;
                `);

                db?.run(`
                    CREATE TRIGGER IF NOT EXISTS audio_ad AFTER DELETE ON audio_files BEGIN
                        INSERT INTO audio_fts(audio_fts, rowid, filename, filepath) VALUES('delete', old.id, old.filename, old.filepath);
                    END;
                `);

                db?.run(`
                    CREATE TRIGGER IF NOT EXISTS audio_au AFTER UPDATE ON audio_files BEGIN
                        INSERT INTO audio_fts(audio_fts, rowid, filename, filepath) VALUES('delete', old.id, old.filename, old.filepath);
                        INSERT INTO audio_fts(rowid, filename, filepath) VALUES (new.id, new.filename, new.filepath);
                    END;
                `);

                // 3. Safe, lazy-bootstrapping script to back-fill pre-existing catalog indexes
                db?.run(`
                    INSERT OR IGNORE INTO audio_fts(rowid, filename, filepath)
                    SELECT id, filename, filepath FROM audio_files 
                    WHERE id NOT IN (SELECT rowid FROM audio_fts)
                `, () => {
                    resolve();
                });
            });
        });
    });
}

export function searchAudio(query: string, genre?: string): Promise<{ results: any[], totalCount: number }> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        
        const params: any[] = [];
        let joinSql = '';
        let whereSql = 'WHERE 1=1';

        if (query && query.trim()) {
            // Tokenize search query terms similar toEverything / Alfred
            const terms = query.trim().split(/\s+/).filter(Boolean);
            const ftsTerms: string[] = [];
            
            terms.forEach(term => {
                if (term.startsWith('.') && term.length > 1) {
                    // Retain exact index scanning for system extension types
                    whereSql += ' AND extension = ?';
                    params.push(term.toLowerCase());
                } else {
                    // Standardize and escape queries safely for FTS5 matching matrix
                    const sanitized = term.replace(/"/g, '""');
                    ftsTerms.push(`"${sanitized}"*`);
                }
            });
            
            if (ftsTerms.length > 0) {
                // Join against virtual index and fire off lightning fast match call
                const ftsExpression = ftsTerms.join(' AND ');
                joinSql = 'JOIN audio_fts ON audio_fts.rowid = audio_files.id';
                whereSql += ' AND audio_fts MATCH ?';
                params.push(ftsExpression);
            }
        }
        
        if (genre) {
            whereSql += ' AND genre = ?';
            params.push(genre);
        }

        const countSql = `SELECT COUNT(*) as total FROM audio_files ${joinSql} ${whereSql}`;
        const rowsSql = `SELECT audio_files.* FROM audio_files ${joinSql} ${whereSql} ORDER BY scanned_at DESC LIMIT 500`;
        
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

export function updateAudioMetadata(id: number, data: { 
    bpm: number, 
    key: string, 
    genre: string, 
    has_vocals: boolean, 
    mood?: string, 
    energy?: number, 
    danceability?: number, 
    viral_score?: number, 
    type?: string 
}): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const sql = `UPDATE audio_files SET bpm = ?, key = ?, genre = ?, has_vocals = ?, mood = ?, energy = ?, danceability = ?, viral_score = ?, type = ? WHERE id = ?`;
        db.run(sql, [
            data.bpm, 
            data.key, 
            data.genre, 
            data.has_vocals ? 1 : 0, 
            data.mood || null, 
            data.energy || null, 
            data.danceability || null, 
            data.viral_score || null, 
            data.type || null, 
            id
        ], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

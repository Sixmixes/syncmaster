import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let db: sqlite3.Database | null = null;

export function getDbPath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'syncmaster_v2.db');
}

export function initDatabase(isRetrying = false): Promise<void> {
    return new Promise((resolve, reject) => {
        const dbPath = getDbPath();
        
        const handleCorruption = async (corruptErr: any) => {
            if (isRetrying) {
                console.error('[DB] Recursive corruption limit hit. Refusing to retry again.');
                return reject(new Error(`Critical DB Rot: ${corruptErr?.message || 'Failed to heal'}`));
            }
            console.warn('[DB EMERGENCY] Disk corruption detected! Initiating physical system wipe and self-healing cycle...');
            try {
                if (db) {
                    await new Promise<void>((res) => { db?.close(() => res()); });
                    db = null;
                }
                
                // Physical disk extraction of corrupted data caches
                const diskFiles = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
                for (const diskFile of diskFiles) {
                    if (fs.existsSync(diskFile)) {
                        try {
                            fs.unlinkSync(diskFile);
                            console.log(`[DB HEALER] Unlinked corrupted file: ${diskFile}`);
                        } catch (e) {
                            // Renaming handles locked cases until system reboots
                            fs.renameSync(diskFile, `${diskFile}.corrupt-${Date.now()}`);
                            console.log(`[DB HEALER] Locked file safely quarantined: ${diskFile}`);
                        }
                    }
                }
                
                // Recurse and rebuild
                initDatabase(true).then(resolve).catch(reject);
            } catch (healErr: any) {
                console.error('[DB HEALER] Critical recovery pipeline failure:', healErr);
                reject(healErr);
            }
        };

        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                if (err.message.includes('malformed') || err.message.includes('corrupt') || err.message.includes('disk')) {
                    return handleCorruption(err);
                }
                console.error('Could not connect to database', err);
                return reject(err);
            }
            console.log('Connected to SQLite database at:', dbPath);
            
            // Proactive, non-blocking integrity check on startup
            db.get('PRAGMA integrity_check', (chkErr, integrityRow: any) => {
                if (chkErr || (integrityRow && integrityRow.integrity_check !== 'ok')) {
                    console.error('[DB] Integrity check failed on launch! Row:', integrityRow, chkErr);
                    return handleCorruption(chkErr || new Error('Integrity check failed'));
                }

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
                    
                    db?.run(`
                        CREATE TABLE IF NOT EXISTS ignored_paths (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            pattern TEXT UNIQUE
                        )
                    `);
                    
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
        const dbPath = getDbPath();
        console.log('[DB] Request received to physically wipe system data caches...');
        
        const wipePhysicalFiles = async () => {
            try {
                if (db) {
                    await new Promise<void>((res) => { db?.close(() => res()); });
                    db = null;
                }
                
                const diskFiles = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
                for (const diskFile of diskFiles) {
                    if (fs.existsSync(diskFile)) {
                        try {
                            fs.unlinkSync(diskFile);
                        } catch (e) {
                            fs.renameSync(diskFile, `${diskFile}.wiped-${Date.now()}`);
                        }
                    }
                }
                
                // Re-initialize fresh database structure
                await initDatabase();
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        
        wipePhysicalFiles();
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

export function addIgnoredPath(pattern: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        db.serialize(() => {
            // Insert the path to exclude permanently from walks
            db?.run('INSERT OR IGNORE INTO ignored_paths (pattern) VALUES (?)', [pattern], (err) => {
                if (err) return reject(err);
            });
            // Wipe matching indexed tracks from the UI instantly so user sees them vanish!
            db?.run('DELETE FROM audio_files WHERE INSTR(LOWER(filepath), LOWER(?)) > 0', [pattern], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

export function getIgnoredPaths(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        db.all('SELECT pattern FROM ignored_paths', [], (err, rows: any[]) => {
            if (err) reject(err);
            else resolve((rows || []).map(r => r.pattern));
        });
    });
}

export function checkDuplicateInDb(filepath: string, filesize: number, filename: string): Promise<string | null> {
    return new Promise((resolve) => {
        if (!db) return resolve(null);
        const sql = `SELECT filepath FROM audio_files WHERE filepath = ? OR (filesize = ? AND filename = ?) LIMIT 1`;
        db.get(sql, [filepath, filesize, filename], (err, row: any) => {
            if (err || !row) resolve(null);
            else resolve(row.filepath);
        });
    });
}

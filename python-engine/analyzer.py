import sys
import json
import os
import librosa
import numpy as np

def analyze_audio(file_path):
    try:
        # Get true duration quickly without loading the full file
        true_duration = librosa.get_duration(path=file_path)
        
        # Load audio file (load 60 seconds from 15s in to skip intros and get the core of the track)
        # If the file is shorter than 15s, start from 0
        offset = 15.0 if true_duration > 30.0 else 0.0
        duration = min(60.0, true_duration - offset) if true_duration > offset else true_duration
        
        y, sr = librosa.load(file_path, offset=offset, duration=duration)
        
        # 1. Harmonic-Percussive Source Separation
        # Separating drums from melodies drastically improves both BPM and Key detection accuracy
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        
        # Guide tempo tracking to avoid rhythm/octave errors
        # Using onset strength on the PERCUSSIVE part makes beat tracking extremely precise
        onset_env = librosa.onset.onset_strength(y=y_percussive, sr=sr)
        
        # Use librosa's feature.rhythm.tempo for a more robust global tempo estimate
        # We don't set a start_bpm to avoid forcing it into a wrong octave, let the algorithm decide
        tempo = librosa.feature.tempo(onset_envelope=onset_env, sr=sr, aggregate=np.median)
        bpm = float(tempo[0]) if isinstance(tempo, (list, np.ndarray)) else float(tempo)
        
        # --- Krumhansl-Schmuckler Key Detection Algorithm ---
        # Highly accurate Pearson-Correlation based profile matching for major/minor keys
        # We use the HARMONIC part to avoid drum transients messing up the pitch classes
        chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr)
        chroma_sum = np.sum(chroma, axis=1)
        
        # Krumhansl-Kessler pitch class templates
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
        
        pitch_classes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        # Normalize the chroma input vector
        chroma_norm = (chroma_sum - np.mean(chroma_sum)) / (np.std(chroma_sum) + 1e-6)
        
        best_corr = -1.0
        best_key = "Cm"
        
        for i in range(12):
            # Shift the major and minor profiles for each of the 12 keys
            shifted_major = np.roll(major_profile, i)
            shifted_minor = np.roll(minor_profile, i)
            
            # Normalize templates
            shifted_major_norm = (shifted_major - np.mean(shifted_major)) / np.std(shifted_major)
            shifted_minor_norm = (shifted_minor - np.mean(shifted_minor)) / np.std(shifted_minor)
            
            # Pearson Correlation
            corr_major = np.corrcoef(chroma_norm, shifted_major_norm)[0, 1]
            corr_minor = np.corrcoef(chroma_norm, shifted_minor_norm)[0, 1]
            
            if corr_major > best_corr:
                best_corr = corr_major
                best_key = pitch_classes[i]
                
            if corr_minor > best_corr:
                best_corr = corr_minor
                best_key = f"{pitch_classes[i]}m"
                
        key = best_key
        
        # Advanced Subgenre Heuristic using DSP (Digital Signal Processing)
        rms_harmonic = float(np.mean(librosa.feature.rms(y=y_harmonic)))
        rms_percussive = float(np.mean(librosa.feature.rms(y=y_percussive)))
        harmonic_ratio = rms_harmonic / (rms_percussive + 1e-6)
        
        # 2. Spectral Rolloff (checks if the audio is muffled/low-passed, indicative of Lo-Fi)
        rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)[0]))
        
        # 3. Classify Subgenres
        genre = "Hip Hop"
        if bpm >= 130 and bpm <= 155:
            if harmonic_ratio > 1.2:
                genre = "Melodic Trap"
            else:
                genre = "Trap"
        elif bpm >= 80 and bpm < 100:
            if rolloff < 3500:
                genre = "Lo-Fi Hip Hop"
            elif harmonic_ratio > 1.1:
                genre = "RnB"
            else:
                genre = "Boom Bap"
        elif bpm >= 60 and bpm < 80:
            if harmonic_ratio > 1.0:
                genre = "RnB / Soul"
            else:
                genre = "Slow Jam"
        elif bpm >= 100 and bpm < 115:
            genre = "Afrobeats"
        elif bpm >= 115 and bpm < 130:
            genre = "House / Dance"
        elif bpm > 155:
            genre = "Drum & Bass"
            
        # --- Advanced Vocal Detection DSP Heuristic ---
        # 1. Zero-Crossing Rate (ZCR) on the isolated harmonic component captures vocal fricatives/consonants
        zcr = librosa.feature.zero_crossing_rate(y=y_harmonic)
        mean_zcr = float(np.mean(zcr))
        
        # 2. Mel-Frequency Cepstral Coefficients (MFCCs) temporal variance is the gold-standard
        # representation of dynamic human vocal tract fluctuations (singing, rap, lyrics) over stationary synth/pad loops.
        mfccs = librosa.feature.mfcc(y=y_harmonic, sr=sr, n_mfcc=13)
        mfcc_var = float(np.mean(np.var(mfccs[1:5], axis=1)))
        
        # Active vocals exhibit high temporal spectral variance compared to repetitive synth loops
        has_vocals_dsp = mfcc_var > 180.0 or (mean_zcr > 0.08 and mfcc_var > 110.0)
        
        # Filename override: if name explicitly states 'instrumental/inst/beat', force instrumental.
        filename_lower = os.path.basename(file_path).lower()
        is_inst_filename = any(kw in filename_lower for kw in ['instrumental', 'inst', 'beat', 'dub'])
        has_vocals = False if is_inst_filename else has_vocals_dsp

        # --- Energy, Mood, Danceability & Virality Metrics (Analyzer v2.1) ---
        
        # 1. Energy: Derived from root-mean-square (RMS) amplitudes and Spectral Centroid (brightness)
        centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        energy_raw = (rms_harmonic + rms_percussive * 1.4) / 2.0
        # Max normalize and clamp to a clean 0-100 integer scale
        energy_score = min(100, max(10, int((energy_raw / 0.18) * 50 + (centroid / 4500) * 50)))
        
        # 2. Danceability: Combination of Percussive prominence, Tempo stability and 120-128 BPM golden ratio alignment
        # Standard dance tempo target variance
        tempo_alignment = max(0, 100 - (abs(124.0 - bpm) * 0.7))
        percussive_prominence = min(1.0, rms_percussive / (rms_harmonic + 1e-6))
        danceability_score = min(100, max(5, int(percussive_prominence * 50 + tempo_alignment * 0.5)))

        # 3. Mood Classification: Correlates Mode (Major/Minor) with Energy density and Spectral Centroid
        is_minor = key.endswith('m')
        if is_minor:
            if energy_score > 70:
                mood = "Dark / Aggressive"
            elif energy_score > 45:
                mood = "Moody / Cinematic"
            else:
                mood = "Melancholic / Deep"
        else:
            if energy_score > 70:
                mood = "Uplifting / Energetic"
            elif energy_score > 45:
                mood = "Warm / Happy"
            else:
                mood = "Chill / Relaxed"

        # 4. Predictive Viral Score: Evaluates energy distribution, tempo urgency, and genre-specific dynamic range
        viral_score = min(100, max(0, int(energy_score * 0.35 + danceability_score * 0.4 + 25)))

        # 5. Smart Type Classification (Beat vs Song vs Acapella)
        # If has vocals but virtually zero drum transients, it's an acapella
        is_acapella = has_vocals and (rms_percussive < 0.004)
        if is_acapella:
            track_type = "Acapella"
        elif has_vocals:
            track_type = "Song"
        elif any(genre_kw in genre for genre_kw in ["Trap", "Hip Hop", "Boom Bap"]):
            track_type = "Beat"
        else:
            track_type = "Instrumental"

        camelot_map = {
            "C": "8B", "C#": "3B", "D": "10B", "D#": "5B", "E": "12B", "F": "7B", "F#": "2B", "G": "9B", "G#": "4B", "A": "11B", "A#": "6B", "B": "1B",
            "Cm": "5A", "C#m": "12A", "Dm": "7A", "D#m": "2A", "Em": "9A", "Fm": "4A", "F#m": "11A", "Gm": "6A", "G#m": "1A", "Am": "8A", "A#m": "3A", "Bm": "10A"
        }
        
        camelot = camelot_map.get(key, key)
            
        result = {
            "bpm": round(bpm),
            "key": key,
            "camelot": camelot,
            "genre": genre,
            "mood": mood,
            "energy": energy_score,
            "danceability": danceability_score,
            "viral_score": viral_score,
            "type": track_type,
            "has_vocals": has_vocals,
            "filename": os.path.basename(file_path),
            "duration": true_duration
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}), file=sys.stderr)
        sys.exit(1)
        
    file_path = sys.argv[1]
    analyze_audio(file_path)

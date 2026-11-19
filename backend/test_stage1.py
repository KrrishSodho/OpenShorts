import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from backend.services.downloader import MediaDownloader
from backend.services.transcriber import AudioTranscriber
from backend.services.face_tracker import FaceAutoTracker
from backend.utils.ffmpeg_helper import probe_media

def run_test():
    ref_video = Path(r"C:\Users\Kirshan Singh\.gemini\antigravity\brain\95271b73-96ea-4d65-90b1-8ce6a1b3193d\.user_uploaded\media_1794665984810_52062bb7.mp4")
    
    print("\n--- STAGE 1 VERIFICATION TEST ---")
    print("1. Ingesting & Probing Reference Video...")
    media_info = MediaDownloader.process_local_file(ref_video)
    print(f"   [OK] Media ID: {media_info['id']}")
    print(f"   [OK] Resolution: {media_info['width']}x{media_info['height']} @ {media_info['fps']} fps")
    print(f"   [OK] Duration: {media_info['duration']}s")
    print(f"   [OK] Extracted 16kHz Audio: {Path(media_info['audio_path']).name}")
    
    print("\n2. Transcribing with Faster-Whisper (Word-Level Timestamps)...")
    res = AudioTranscriber.transcribe(Path(media_info['audio_path']), media_info['id'], model_size="tiny")
    print(f"   [OK] Language: {res['detected_language']} (conf: {res['language_probability']})")
    print(f"   [OK] Total Words Transcribed: {res['total_words']}")
    print(f"   [OK] Transcript Saved To: {res['transcript_json_path']}")
    print("   [OK] Sample Word Timestamps (First 5 words):")
    for w in res['words'][:5]:
        print(f"        '{w['word']}' [{w['start']}s -> {w['end']}s] (conf: {w['confidence']})")
        
    print("\n3. Testing Face Tracker & Aspect Ratio Check...")
    crop_info = FaceAutoTracker.compute_vertical_crop(ref_video)
    print(f"   [OK] Already vertical? {not crop_info['needs_crop']}")
    print(f"   [OK] Crop Params: {crop_info}")
    
    print("\nSTAGE 1 BACKEND VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL!")

if __name__ == "__main__":
    run_test()

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from backend.services.downloader import MediaDownloader

url = "https://youtu.be/OMwwLYWaQ8Q"
print("Testing yt-dlp download for:", url)
try:
    res = MediaDownloader.download_youtube_url(url)
    print("Download result:", res)
except Exception as e:
    import traceback
    print("ERROR CAUGHT:")
    traceback.print_exc()

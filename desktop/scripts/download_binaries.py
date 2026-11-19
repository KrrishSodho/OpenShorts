# PATH: desktop/scripts/download_binaries.py
"""
FFmpeg & FFprobe Binary Provisioner for Standalone Desktop Packaging
Provisions static Windows (x64) ffmpeg.exe and ffprobe.exe into desktop/resources/bin/
1. Checks if already provisioned in desktop/resources/bin/
2. Attempts fast copy from local system WinGet / Chocolatey / PATH
3. If not found locally, downloads official Gyan.dev GPL essentials build
"""

import os
import sys
import shutil
import urllib.request
import zipfile
import subprocess
from pathlib import Path

DESKTOP_DIR = Path(__file__).resolve().parent.parent
BIN_DIR = DESKTOP_DIR / "resources" / "bin"
GYAN_URL = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"


def verify_binary(bin_path: Path) -> bool:
    try:
        res = subprocess.run([str(bin_path), "-version"], capture_output=True, text=True, timeout=10)
        return res.returncode == 0
    except Exception:
        return False


def provision_binaries():
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    ffmpeg_target = BIN_DIR / "ffmpeg.exe"
    ffprobe_target = BIN_DIR / "ffprobe.exe"

    if ffmpeg_target.exists() and ffprobe_target.exists():
        if verify_binary(ffmpeg_target) and verify_binary(ffprobe_target):
            print(f"[Binary Provisioner] FFmpeg & FFprobe are already provisioned at {BIN_DIR}")
            return True

    print("[Binary Provisioner] Checking local host environment for existing binaries...")
    ffmpeg_host = shutil.which("ffmpeg")
    ffprobe_host = shutil.which("ffprobe")

    if ffmpeg_host and ffprobe_host:
        try:
            print(f"[Binary Provisioner] Copying host binaries:\n  ffmpeg:  {ffmpeg_host}\n  ffprobe: {ffprobe_host}")
            shutil.copy2(ffmpeg_host, ffmpeg_target)
            shutil.copy2(ffprobe_host, ffprobe_target)
            if verify_binary(ffmpeg_target) and verify_binary(ffprobe_target):
                print(f"[Binary Provisioner] Successfully provisioned binaries to {BIN_DIR}")
                return True
        except Exception as e:
            print(f"[Binary Provisioner] Local copy failed ({e}), proceeding to remote download.")

    print(f"[Binary Provisioner] Downloading static ffmpeg build from {GYAN_URL}...")
    zip_dest = BIN_DIR / "ffmpeg_temp.zip"

    def reporthook(blocknum, blocksize, totalsize):
        readsofar = blocknum * blocksize
        if totalsize > 0:
            percent = readsofar * 1e2 / totalsize
            s = f"\rDownloading: {percent:.1f}% ({readsofar / 1024 / 1024:.1f} MB / {totalsize / 1024 / 1024:.1f} MB)"
            sys.stdout.write(s)
            sys.stdout.flush()

    try:
        urllib.request.urlretrieve(GYAN_URL, zip_dest, reporthook=reporthook)
        print("\n[Binary Provisioner] Download complete. Extracting ffmpeg.exe & ffprobe.exe...")

        with zipfile.ZipFile(zip_dest, "r") as z:
            for member in z.namelist():
                if member.endswith("bin/ffmpeg.exe"):
                    with z.open(member) as source, open(ffmpeg_target, "wb") as target:
                        shutil.copyfileobj(source, target)
                elif member.endswith("bin/ffprobe.exe"):
                    with z.open(member) as source, open(ffprobe_target, "wb") as target:
                        shutil.copyfileobj(source, target)

        if zip_dest.exists():
            zip_dest.unlink()

        if verify_binary(ffmpeg_target) and verify_binary(ffprobe_target):
            print(f"[Binary Provisioner] Successfully extracted and verified binaries in {BIN_DIR}")
            return True
        else:
            print("[Binary Provisioner] Extraction failed or binary verification returned non-zero code.", file=sys.stderr)
            return False

    except Exception as e:
        print(f"[Binary Provisioner] Error downloading binaries: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    success = provision_binaries()
    sys.exit(0 if success else 1)

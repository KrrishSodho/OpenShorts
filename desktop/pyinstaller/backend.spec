# -*- mode: python ; coding: utf-8 -*-
# PATH: desktop/pyinstaller/backend.spec

import sys
import os
from pathlib import Path
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, collect_dynamic_libs

# Resolve project paths
DESKTOP_DIR = Path(SPEC).resolve().parent.parent
PROJECT_ROOT = DESKTOP_DIR.parent

block_cipher = None

# Collect submodules and dynamic libraries for heavy C-extensions
hidden_imports = [
    "uvicorn",
    "uvicorn.logging",
    "uvicorn.loops.auto",
    "uvicorn.protocols.http.auto",
    "uvicorn.lifespan.on",
    "fastapi",
    "pydantic",
    "pydantic_core",
    "starlette",
    "httpx",
    "requests",
    "numpy",
    "cv2",
    "faster_whisper",
    "ctranslate2",
    "tokenizers",
    "google.genai",
    "google.genai.types",
    "google.genai.models",
    "yt_dlp",
]
hidden_imports += collect_submodules("uvicorn")
hidden_imports += collect_submodules("backend")

# Collect data files
datas = []

# Include default presets if they exist
presets_path = PROJECT_ROOT / "presets"
if presets_path.exists():
    datas.append((str(presets_path), "presets"))

# Include faster_whisper assets / tokenizers if needed
datas += collect_data_files("faster_whisper")
datas += collect_data_files("tokenizers")

# Collect dynamic libs (ctranslate2, onnxruntime, opencv DLLs)
binaries = []
try:
    binaries += collect_dynamic_libs("ctranslate2")
except Exception:
    pass
try:
    binaries += collect_dynamic_libs("cv2")
except Exception:
    pass

a = Analysis(
    [str(DESKTOP_DIR / "pyinstaller" / "entrypoint.py")],
    pathex=[str(PROJECT_ROOT), str(DESKTOP_DIR)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "IPython", "jupyter"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="viral-studio-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Keep console output visible during development / piped to Electron
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="viral-studio-backend",
)

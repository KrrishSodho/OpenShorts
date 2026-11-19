import cv2
import numpy as np
import logging
import subprocess
from pathlib import Path
from typing import Dict, Any, Literal, List, Optional, Tuple

from backend.utils.ffmpeg_helper import probe_media

logger = logging.getLogger("viral_studio.face_tracker")

CropFocusType = Literal["auto", "center", "left", "right"]

# Optional MediaPipe Face Detection (much stronger on angled/wide podcast shots)
try:
    import mediapipe as mp
    _MP_FACE_AVAILABLE = hasattr(mp, "solutions") and hasattr(mp.solutions, "face_detection")
except Exception:
    mp = None
    _MP_FACE_AVAILABLE = False


class FaceAutoTracker:
    """
    Shot-Boundary Aware Speaker Face Tracker:
    1. Finds exact hard camera cuts via HSV color histogram distance.
    2. Samples multiple frames inside each continuous shot.
    3. Uses MediaPipe (if available) or Multi-Angle OpenCV Cascades + Mouth-Motion
       tie-breaking to center the active speaker and reject TV corner watermarks.
    """

    @staticmethod
    def _cx_to_pan(cx_pct: float) -> int:
        """
        Exact 9:16-inside-16:9 viewport math:
        Visible 9:16 slice width = (9/16)/(16/9) = 31.64% (half = 15.82%, travel = 68.36%).
        Clamps to safe viewport margin (8% to 92%) so heads/shoulders are never pressed against the viewport edge.
        """
        pan = (cx_pct - 15.82) / 0.6836
        return int(round(max(8.0, min(92.0, pan))))

    @classmethod
    def _detect_shot_boundaries(
        cls, cap: cv2.VideoCapture, fps: float, total_frames: int
    ) -> List[Tuple[int, int]]:
        """
        Detects hard camera cuts using downscaled HSV histogram correlation.
        Returns list of (start_frame, end_frame) tuples covering the clip.
        """
        sample_step = max(1, int(round(fps / 6.0)))  # ~6 checks per second
        min_shot_frames = max(10, int(round(fps * 0.75)))

        cut_frames = [0]
        prev_hist = None

        for f_idx in range(0, total_frames, sample_step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
            ret, frame = cap.read()
            if not ret:
                break

            small = cv2.resize(frame, (160, 90))
            hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
            hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
            cv2.normalize(hist, hist)

            if prev_hist is not None:
                corr = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_CORREL)
                if corr < 0.78 and (f_idx - cut_frames[-1]) >= min_shot_frames:
                    cut_frames.append(f_idx)

            prev_hist = hist

        shots: List[Tuple[int, int]] = []
        for i, start_f in enumerate(cut_frames):
            end_f = cut_frames[i + 1] - 1 if i + 1 < len(cut_frames) else total_frames - 1
            if end_f > start_f:
                shots.append((start_f, end_f))

        return shots if shots else [(0, max(1, total_frames - 1))]

    @classmethod
    def _detect_faces_in_frame(
        cls,
        frame: np.ndarray,
        w: int,
        h: int,
        mp_detector: Any,
        frontal_cascade: cv2.CascadeClassifier,
        profile_cascade: cv2.CascadeClassifier,
    ) -> List[Dict[str, float]]:
        """
        Returns list of candidate face dicts: {"cx": float, "cy": float, "area": float, "bw": float, "bh": float, "x": float, "y": float}.
        Rejects top-corner broadcast watermarks (e.g. BBC logo at x<20%, y<18%).
        """
        results: List[Dict[str, float]] = []

        # Tier 1: MediaPipe Full-Range Face Detection
        if mp_detector is not None:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_res = mp_detector.process(rgb)
            if mp_res and mp_res.detections:
                for det in mp_res.detections:
                    box = det.location_data.relative_bounding_box
                    bw = box.width * w
                    bh = box.height * h
                    bx = box.xmin * w
                    by = box.ymin * h
                    cx = bx + bw / 2.0
                    cy = by + bh / 2.0

                    # Ignore tiny background faces or top-corner watermarks
                    if bh < h * 0.045:
                        continue
                    if (cy / h) < 0.14 and (cx / w < 0.22 or cx / w > 0.78) and bh < h * 0.12:
                        continue

                    results.append({
                        "cx": cx,
                        "cy": cy,
                        "area": bw * bh,
                        "x": max(0.0, bx),
                        "y": max(0.0, by),
                        "bw": bw,
                        "bh": bh,
                    })
                if results:
                    return results

        # Tier 2: OpenCV Frontal + Side-Profile Cascades
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        y_min = int(h * 0.05)
        y_max = int(h * 0.80)
        roi_gray = gray[y_min:y_max, :]

        # Allow smaller faces (6.5% height) so wide podcast shots are detected too
        min_face_px = max(36, int(h * 0.065))

        def _append_box(fx: int, fy: int, fw: int, fh: int, boost: float = 1.0):
            cx = fx + fw / 2.0
            cy = (fy + y_min) + fh / 2.0
            # Reject small top-corner broadcast logos
            if (cy / h) < 0.16 and (cx / w < 0.22 or cx / w > 0.78) and fh < h * 0.12:
                return
            results.append({
                "cx": cx,
                "cy": cy,
                "area": fw * fh * boost,
                "x": float(fx),
                "y": float(fy + y_min),
                "bw": float(fw),
                "bh": float(fh),
            })

        frontal = frontal_cascade.detectMultiScale(
            roi_gray, scaleFactor=1.12, minNeighbors=5, minSize=(min_face_px, min_face_px)
        )
        for fx, fy, fw, fh in frontal:
            _append_box(int(fx), int(fy), int(fw), int(fh), boost=1.35)

        if not results and not profile_cascade.empty():
            prof = profile_cascade.detectMultiScale(
                roi_gray, scaleFactor=1.12, minNeighbors=4, minSize=(min_face_px, min_face_px)
            )
            for fx, fy, fw, fh in prof:
                _append_box(int(fx), int(fy), int(fw), int(fh), boost=1.0)

            # Check horizontally flipped frame for right-facing profile
            flipped = cv2.flip(roi_gray, 1)
            prof_flip = profile_cascade.detectMultiScale(
                flipped, scaleFactor=1.12, minNeighbors=4, minSize=(min_face_px, min_face_px)
            )
            for fx, fy, fw, fh in prof_flip:
                real_fx = w - (int(fx) + int(fw))
                _append_box(real_fx, int(fy), int(fw), int(fh), boost=1.0)

        return results

    @classmethod
    def _pick_active_speaker_cx(
        cls,
        faces: List[Dict[str, float]],
        curr_gray: np.ndarray,
        prev_gray: Optional[np.ndarray],
        w: int,
        h: int,
    ) -> float:
        """
        If multiple faces exist (dual-speaker shot), picks the active speaker:
        Combines face area prominence (foreground host) and mouth/jaw motion energy,
        penalizing extreme top/bottom outlier placements.
        """
        if not faces:
            return w / 2.0
        if len(faces) == 1 or prev_gray is None:
            best = max(faces, key=lambda f: f["area"])
            return best["cx"]

        best_score = -1.0
        best_cx = faces[0]["cx"]

        for f in faces:
            x1 = int(max(0, f["x"]))
            x2 = int(min(w, f["x"] + f["bw"]))
            # Focus on lower half of face (mouth/jaw region)
            y1 = int(max(0, f["y"] + f["bh"] * 0.45))
            y2 = int(min(h, f["y"] + f["bh"]))

            motion_energy = 0.0
            if x2 > x1 + 4 and y2 > y1 + 4:
                patch_curr = curr_gray[y1:y2, x1:x2]
                patch_prev = prev_gray[y1:y2, x1:x2]
                diff = cv2.absdiff(patch_curr, patch_prev)
                motion_energy = float(np.mean(diff))

            # Eye-level / center vertical positioning factor (penalize extreme borders)
            cy_norm = f["cy"] / h
            v_penalty = 1.0 - min(0.4, abs(cy_norm - 0.38) * 0.5)

            # Score: prominence + mouth movement * vertical stability
            score = ((f["area"] / (w * h)) * 100.0 * 0.65 + (motion_energy * 0.35)) * v_penalty
            if score > best_score:
                best_score = score
                best_cx = f["cx"]

        return best_cx

    @classmethod
    def _generate_pan_keyframes_fast_ffmpeg(
        cls,
        video_path: Path,
        w: int,
        h: int,
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Ultra-fast sequential proxy stream face tracking via FFmpeg pipe:
        Downscales directly to 320x180 at 2 fps.
        Detects camera cuts via HSV correlation and tracks active speaker faces.
        Runs in ~1-2s for a 60-second video without OpenCV random seeks.
        """
        proxy_w, proxy_h = 320, 180
        fps_sample = 2.0
        frame_bytes = proxy_w * proxy_h * 3

        cmd = [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(video_path),
            "-vf",
            f"scale={proxy_w}:{proxy_h},fps={fps_sample}",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "bgr24",
            "pipe:1",
        ]

        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
        except Exception as e:
            logger.warning(f"FFmpeg proxy stream launch failed: {e}")
            return None

        frontal_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        profile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_profileface.xml"
        )

        mp_detector = None
        if _MP_FACE_AVAILABLE:
            try:
                mp_detector = mp.solutions.face_detection.FaceDetection(
                    model_selection=1, min_detection_confidence=0.42
                )
            except Exception:
                mp_detector = None

        prev_hist = None
        prev_gray = None
        current_shot_start_t = 0.0
        current_shot_pans: List[int] = []
        raw_keyframes: List[Dict[str, Any]] = []

        frame_idx = 0
        min_shot_duration = 0.8  # minimum 0.8s per shot

        try:
            while True:
                raw = proc.stdout.read(frame_bytes)
                if len(raw) < frame_bytes:
                    break

                t_sec = frame_idx / fps_sample
                frame = np.frombuffer(raw, dtype=np.uint8).reshape((proxy_h, proxy_w, 3))

                # Shot cut detection
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
                cv2.normalize(hist, hist)

                is_cut = False
                if prev_hist is not None:
                    corr = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_CORREL)
                    if corr < 0.76 and (t_sec - current_shot_start_t) >= min_shot_duration:
                        is_cut = True

                if is_cut and current_shot_pans:
                    # Finalize current shot
                    current_shot_pans.sort()
                    median_pan = current_shot_pans[len(current_shot_pans) // 2]
                    raw_keyframes.append({
                        "t": round(current_shot_start_t, 2),
                        "pan": int(median_pan),
                        "transition": "cut",
                    })
                    current_shot_start_t = t_sec
                    current_shot_pans = []
                elif is_cut:
                    current_shot_start_t = t_sec

                prev_hist = hist

                # Face detection on proxy frame
                curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = cls._detect_faces_in_frame(
                    frame, proxy_w, proxy_h, mp_detector, frontal_cascade, profile_cascade
                )
                if faces:
                    cx = cls._pick_active_speaker_cx(faces, curr_gray, prev_gray, proxy_w, proxy_h)
                    cx_pct = (cx / proxy_w) * 100.0
                    current_shot_pans.append(cls._cx_to_pan(cx_pct))

                prev_gray = curr_gray
                frame_idx += 1

            if proc.stdout:
                proc.stdout.close()
            proc.wait()

            # Final shot flush
            if current_shot_pans:
                current_shot_pans.sort()
                median_pan = current_shot_pans[len(current_shot_pans) // 2]
            else:
                median_pan = raw_keyframes[-1]["pan"] if raw_keyframes else 50

            raw_keyframes.append({
                "t": round(current_shot_start_t, 2),
                "pan": int(median_pan),
                "transition": "cut",
            })

        except Exception as e:
            logger.warning(f"Error during FFmpeg proxy face tracking: {e}")
            if proc and proc.poll() is None:
                proc.kill()
            return None
        finally:
            if mp_detector is not None:
                try:
                    mp_detector.close()
                except Exception:
                    pass

        if not raw_keyframes:
            return None

        # Merge consecutive shots whose pan differs by < 8%
        merged: List[Dict[str, Any]] = [raw_keyframes[0]]
        for kf in raw_keyframes[1:]:
            if abs(kf["pan"] - merged[-1]["pan"]) >= 8:
                merged.append(kf)

        logger.info(f"Fast FFmpeg Shot-Boundary Tracking generated {len(merged)} keyframes in {frame_idx} frames: {merged}")
        return merged

    @classmethod
    def generate_pan_keyframes(
        cls,
        video_path: Path,
        sample_interval_sec: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """
        Detects exact camera cuts and computes one rock-solid pan% per shot
        by sampling multiple frames inside each shot and taking the median speaker center.
        """
        if not video_path.exists():
            return [{"t": 0.0, "pan": 50, "transition": "cut"}]

        probe = probe_media(video_path)
        w, h = probe.get("width") or 0, probe.get("height") or 0
        if w > 0 and h > 0:
            if h >= w:
                return [{"t": 0.0, "pan": 50, "transition": "cut"}]
            fast_res = cls._generate_pan_keyframes_fast_ffmpeg(video_path, w, h)
            if fast_res:
                return fast_res

        cap = cv2.VideoCapture(str(video_path))
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if w <= 0:
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        if h <= 0:
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if w <= 0 or h <= 0 or total_frames <= 0:
            cap.release()
            return [{"t": 0.0, "pan": 50, "transition": "cut"}]

        # If video is already vertical or square, center pan is exact
        if h >= w:
            cap.release()
            return [{"t": 0.0, "pan": 50, "transition": "cut"}]

        shots = cls._detect_shot_boundaries(cap, fps, total_frames)

        frontal_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        profile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_profileface.xml"
        )

        mp_detector = None
        if _MP_FACE_AVAILABLE:
            try:
                mp_detector = mp.solutions.face_detection.FaceDetection(
                    model_selection=1, min_detection_confidence=0.42
                )
            except Exception as e:
                logger.warning(f"MediaPipe init skipped ({e}), using OpenCV fallback.")
                mp_detector = None

        raw_keyframes: List[Dict[str, Any]] = []

        for shot_idx, (s_start, s_end) in enumerate(shots):
            shot_len = s_end - s_start
            # Sample up to 7 evenly spaced frames inside the interior of this shot
            pad = min(3, shot_len // 6)
            inner_start = s_start + pad
            inner_end = max(inner_start, s_end - pad)
            num_samples = min(7, max(2, int((shot_len / fps) / 0.4)))
            sample_frames = np.linspace(inner_start, inner_end, num=num_samples, dtype=int)

            detected_pans: List[int] = []
            prev_gray = None

            for f_idx in sample_frames:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(f_idx))
                ret, frame = cap.read()
                if not ret:
                    continue

                curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = cls._detect_faces_in_frame(
                    frame, w, h, mp_detector, frontal_cascade, profile_cascade
                )
                if faces:
                    cx = cls._pick_active_speaker_cx(faces, curr_gray, prev_gray, w, h)
                    cx_pct = (cx / w) * 100.0
                    detected_pans.append(cls._cx_to_pan(cx_pct))

                prev_gray = curr_gray

            t_sec = round(s_start / fps, 2) if shot_idx > 0 else 0.0
            if detected_pans:
                detected_pans.sort()
                median_pan = detected_pans[len(detected_pans) // 2]
            else:
                # If no face detected in this shot, inherit previous shot or fallback to 50%
                median_pan = raw_keyframes[-1]["pan"] if raw_keyframes else 50

            raw_keyframes.append({"t": t_sec, "pan": int(median_pan), "transition": "cut"})

        if mp_detector is not None:
            try:
                mp_detector.close()
            except Exception:
                pass
        cap.release()

        if not raw_keyframes:
            return [{"t": 0.0, "pan": 50, "transition": "cut"}]

        # Merge consecutive shots whose pan differs by < 8% to keep framing rock-steady
        merged: List[Dict[str, Any]] = [raw_keyframes[0]]
        for kf in raw_keyframes[1:]:
            if abs(kf["pan"] - merged[-1]["pan"]) >= 8:
                merged.append(kf)

        logger.info(f"Shot-Boundary Face Tracking generated {len(merged)} keyframes: {merged}")
        return merged

    @classmethod
    def compute_vertical_crop(
        cls,
        video_path: Path,
        sample_interval_sec: float = 0.5,
        crop_focus: CropFocusType = "auto",
    ) -> Dict[str, Any]:
        probe = probe_media(video_path)
        w, h = probe["width"], probe["height"]

        if probe["is_vertical"] or (w is None or h is None):
            return {
                "needs_crop": False,
                "crop_x": 0,
                "crop_y": 0,
                "crop_w": w or 1080,
                "crop_h": h or 1920,
            }

        target_crop_w = min(w, int(h * (9 / 16)))

        if crop_focus == "center":
            crop_x = int((w - target_crop_w) / 2)
        elif crop_focus == "left":
            crop_x = int((w - target_crop_w) * 0.15)
        elif crop_focus == "right":
            crop_x = int((w - target_crop_w) * 0.85)
        else:
            kfs = cls.generate_pan_keyframes(video_path, sample_interval_sec)
            first_pan = kfs[0]["pan"] if kfs else 50
            crop_x = int((w - target_crop_w) * (first_pan / 100.0))

        return {
            "needs_crop": True,
            "crop_x": max(0, min(crop_x, w - target_crop_w)),
            "crop_y": 0,
            "crop_w": target_crop_w,
            "crop_h": h,
            "original_width": w,
            "original_height": h,
        }

    @classmethod
    def render_vertical_crop(
        cls,
        input_path: Path,
        output_path: Path,
        crop_focus: CropFocusType = "auto",
    ) -> Path:
        crop_info = cls.compute_vertical_crop(input_path, crop_focus=crop_focus)
        if not crop_info["needs_crop"]:
            import shutil
            shutil.copy2(input_path, output_path)
            return output_path

        cx = crop_info["crop_x"]
        cy = crop_info["crop_y"]
        cw = crop_info["crop_w"]
        ch = crop_info["crop_h"]

        filter_str = f"crop={cw}:{ch}:{cx}:{cy},scale=1080:1920:flags=fast_bilinear,setsar=1"
        media_info = probe_media(input_path)
        has_audio = media_info.get("has_audio", False)

        cmd = [
            "ffmpeg", "-y", "-i", str(input_path),
            "-vf", filter_str,
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
            "-pix_fmt", "yuv420p",
        ]
        if has_audio:
            cmd.extend(["-c:a", "copy"])
        else:
            cmd.append("-an")
        cmd.extend(["-movflags", "+faststart", str(output_path)])

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
        except subprocess.CalledProcessError as exc:
            logger.error(f"FFmpeg vertical crop failed: {exc.stderr}")
            raise
        return output_path
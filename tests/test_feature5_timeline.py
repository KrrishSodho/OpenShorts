import unittest
import math


def clamp_trim_boundaries(trim_start: float, trim_end: float, duration: float, min_duration: float = 0.5):
    """
    Clamps trim range within [0, duration] with minimum valid clip duration.
    """
    safe_start = max(0.0, min(trim_start, duration - min_duration))
    safe_end = min(duration, max(trim_end, safe_start + min_duration))
    if safe_end <= safe_start:
        safe_end = min(duration, safe_start + min_duration)
    return safe_start, safe_end


def compute_magnetic_snap(current_time: float, snap_targets: list[tuple[float, str]], threshold: float = 0.12):
    """
    Finds the closest snap point within threshold.
    Returns (snapped_time, snap_label) or (current_time, None).
    """
    closest_dist = float("inf")
    closest_target = None

    for target_time, label in snap_targets:
        dist = abs(current_time - target_time)
        if dist < threshold and dist < closest_dist:
            closest_dist = dist
            closest_target = (target_time, label)

    if closest_target is not None:
        return closest_target[0], closest_target[1]
    return current_time, None


def volume_to_db(volume: float) -> float:
    """
    Converts linear volume (0.0 to 1.0+) to decibels (dB) with -60 dB floor.
    """
    if volume <= 0.001:
        return -60.0
    return round(20.0 * math.log10(volume), 1)


def calculate_speech_bucket_energy(bucket_start: float, bucket_end: float, words: list[dict]) -> float:
    """
    Calculates acoustic energy fraction for a timeline bar based on overlapping words.
    """
    overlap_duration = 0.0
    bucket_len = max(0.001, bucket_end - bucket_start)

    for w in words:
        w_start = w.get("start", 0.0)
        w_end = w.get("end", 0.0)
        overlap = max(0.0, min(bucket_end, w_end) - max(bucket_start, w_start))
        overlap_duration += overlap

    activity_ratio = min(1.0, overlap_duration / bucket_len)
    # Scale to bar height between 0.15 (ambient floor) and 0.95 (peak speech)
    return round(0.15 + (activity_ratio * 0.80), 3)


class TestFeature5Timeline(unittest.TestCase):

    def test_trim_clamping(self):
        duration = 30.0

        # Normal valid trim
        start, end = clamp_trim_boundaries(2.0, 15.0, duration)
        self.assertEqual(start, 2.0)
        self.assertEqual(end, 15.0)

        # Inverted handles (start > end)
        start, end = clamp_trim_boundaries(18.0, 10.0, duration, min_duration=1.0)
        self.assertLess(start, end)
        self.assertGreaterEqual(end - start, 1.0)

        # Exceeding duration
        start, end = clamp_trim_boundaries(28.0, 35.0, duration, min_duration=0.5)
        self.assertEqual(end, 30.0)
        self.assertLessEqual(start, 29.5)

    def test_magnetic_snapping(self):
        snap_points = [
            (3.50, "cut"),
            (7.20, "motion"),
            (12.00, "cut")
        ]

        # Close to cut at 3.50 within threshold 0.12s
        snapped_time, label = compute_magnetic_snap(3.54, snap_points, threshold=0.12)
        self.assertEqual(snapped_time, 3.50)
        self.assertEqual(label, "cut")

        # Close to motion at 7.20
        snapped_time, label = compute_magnetic_snap(7.15, snap_points, threshold=0.12)
        self.assertEqual(snapped_time, 7.20)
        self.assertEqual(label, "motion")

        # Far away from any snap point
        snapped_time, label = compute_magnetic_snap(5.00, snap_points, threshold=0.12)
        self.assertEqual(snapped_time, 5.00)
        self.assertIsNone(label)

    def test_audio_db_conversion(self):
        # Full volume 1.0 -> 0.0 dB
        self.assertEqual(volume_to_db(1.0), 0.0)

        # Half volume 0.5 -> ~ -6.0 dB
        self.assertEqual(volume_to_db(0.5), -6.0)

        # Quarter volume 0.25 -> ~ -12.0 dB
        self.assertEqual(volume_to_db(0.25), -12.0)

        # Zero or near zero -> noise floor -60.0 dB
        self.assertEqual(volume_to_db(0.0), -60.0)
        self.assertEqual(volume_to_db(0.0001), -60.0)

    def test_speech_bucket_energy(self):
        words = [
            {"word": "viral", "start": 1.0, "end": 2.0},
            {"word": "studio", "start": 2.2, "end": 3.0}
        ]

        # Bucket completely inside speech (1.2 to 1.8)
        energy_inside = calculate_speech_bucket_energy(1.2, 1.8, words)
        self.assertEqual(energy_inside, 0.95)

        # Bucket in pure silence (4.0 to 5.0)
        energy_silent = calculate_speech_bucket_energy(4.0, 5.0, words)
        self.assertEqual(energy_silent, 0.15)

        # Bucket partially overlapping (0.5 to 1.5)
        energy_partial = calculate_speech_bucket_energy(0.5, 1.5, words)
        self.assertGreater(energy_partial, 0.15)
        self.assertLess(energy_partial, 0.95)


if __name__ == "__main__":
    unittest.main()

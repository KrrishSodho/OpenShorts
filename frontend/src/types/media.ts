export interface MediaInfo {
  id: string;
  title: string;
  duration: number;
  video_path: string;
  audio_path?: string;
  width?: number;
  height?: number;
  fps?: number;
  source_url?: string;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptSegment {
  id?: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptData {
  media_id: string;
  language?: string;
  detected_language?: string;
  duration?: number;
  total_words?: number;
  text?: string;
  words: TranscriptWord[];
  segments?: TranscriptSegment[];
}

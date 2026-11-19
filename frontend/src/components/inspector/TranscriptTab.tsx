import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { ClipEditState } from '../../types';
import { Button, Input } from '../ui';

interface TranscriptTabProps {
  clip: ClipEditState;
  currentPlaySec: number;
  isRendering: boolean;
  updateClipWordText: (wordIndex: number, newWord: string) => void;
  onSeekRelative: (sec: number) => void;
}

export const TranscriptTab: React.FC<TranscriptTabProps> = ({
  clip,
  currentPlaySec,
  isRendering,
  updateClipWordText,
  onSeekRelative,
}) => {
  const [editingWordIdx, setEditingWordIdx] = useState<number | null>(null);
  const [wordDraft, setWordDraft] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const commitWordEdit = () => {
    if (editingWordIdx !== null && wordDraft.trim()) {
      updateClipWordText(editingWordIdx, wordDraft.trim());
    }
    setEditingWordIdx(null);
  };

  const handleCopyAll = () => {
    if (clip.words.length === 0) return;
    const text = clip.words.map((w) => w.word).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    if (clip.words.length === 0) return;
    const fullText = clip.words.map((w) => w.word).join(' ');
    const timestamped = clip.words
      .map((w) => `[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.word}`)
      .join('\n');

    const duration = Math.max(1, clip.endTime - clip.startTime);
    const content = `VIRAL STUDIO // TRANSCRIPT EXPORT
Clip Title: ${clip.title || 'Untitled Short'}
Duration: ${duration.toFixed(1)}s (${clip.words.length} words)

--- FULL TRANSCRIPT TEXT ---
${fullText}

--- WORD-BY-WORD TIMESTAMPS ---
${timestamped}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (clip.title || 'short')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 30);
    a.download = `transcript_${safeTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col gap-2.5 overflow-hidden">
      {/* Action Toolbar: Word count + Copy All + Download */}
      <div className="pb-2 border-b border-studio-border flex items-center justify-between gap-1.5 shrink-0 min-w-0">
        <span className="text-[10px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 shrink-0">
          {clip.words.length} words
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant={copied ? 'primary' : 'outline'}
            size="xs"
            onClick={handleCopyAll}
            leftIcon={
              copied ? (
                <Check className="w-3 h-3 text-slate-950" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )
            }
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={handleDownloadTranscript}
            leftIcon={<Download className="w-3 h-3 text-cyan-400" />}
          >
            .TXT
          </Button>
        </div>
      </div>

      <div className="text-[10px] font-mono text-slate-500 shrink-0 truncate">
        Click to seek / Double-click to edit typo:
      </div>

      {/* Contained transcript word well with dedicated scroll boundary */}
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex flex-wrap content-start gap-1 select-none shadow-inner">
        {clip.words.map((w, idx) => {
          const isActive =
            currentPlaySec >= w.start - 0.05 && currentPlaySec <= w.end + 0.1;
          const isPast = currentPlaySec > w.end + 0.1;

          if (editingWordIdx === idx) {
            return (
              <Input
                key={idx}
                autoFocus
                sizeVariant="sm"
                value={wordDraft}
                onChange={(e) => setWordDraft(e.target.value)}
                onBlur={commitWordEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitWordEdit();
                  if (e.key === 'Escape') setEditingWordIdx(null);
                }}
                className="h-6 text-xs px-1.5 py-0 w-24 max-w-full font-bold bg-cyan-950 border-cyan-400 text-white"
                fullWidth={false}
              />
            );
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isRendering}
              onClick={() => onSeekRelative(w.start + 0.02)}
              onDoubleClick={() => {
                if (isRendering) return;
                setEditingWordIdx(idx);
                setWordDraft(w.word);
              }}
              title={`At ${w.start.toFixed(2)}s - Double-click to edit typo`}
              className={`text-xs px-1.5 py-0.5 rounded transition-all select-none max-w-full truncate focus:outline-none focus:ring-1 focus:ring-cyan-400/50 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm shadow-cyan-500/40 scale-105 z-10'
                  : isPast
                  ? 'text-slate-200 bg-slate-900/60 hover:bg-slate-800'
                  : 'text-slate-400 bg-slate-900/30 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {w.word}
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Copy, Check, Cpu, AlertTriangle, Sparkles, Terminal, Loader2, Layers } from 'lucide-react';
import { Modal, Button, Badge } from './ui';

interface AiTraceAttempt {
  model: string;
  status: 'success' | 'failed';
  error?: string | null;
}

interface AiTraceHistoryEntry {
  timestamp: number;
  purpose: string;
  source: 'gemini' | 'fallback' | 'claude';
  model: string | null;
  error?: string | null;
  prompt_summary: string;
  raw_response: string;
  tokens: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  attempts?: AiTraceAttempt[];
}

interface AiTraceData {
  source: 'gemini' | 'fallback' | 'claude';
  model: string | null;
  error: string | null;
  prompt_summary: string;
  raw_response: string;
  tokens: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timestamp?: number | null;
  attempts?: AiTraceAttempt[];
  history?: AiTraceHistoryEntry[];
  total_calls?: number;
  total_video_tokens?: number;
  cumulative_tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AiTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiTraceModal: React.FC<AiTraceModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<AiTraceData | null>(null);
  const [selectedCallIdx, setSelectedCallIdx] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/ai-trace')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res: AiTraceData) => {
        setData(res);
        if (res.history && res.history.length > 0) {
          setSelectedCallIdx(res.history.length - 1); // default to most recent
        }
      })
      .catch((err) => {
        setData({
          source: 'fallback',
          model: 'offline_fallback',
          error: `Failed to fetch AI trace: ${err.message}`,
          prompt_summary: 'Unable to connect to /api/ai-trace',
          raw_response: '{}',
          tokens: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const activeCall =
    data?.history && data.history.length > 0 && selectedCallIdx < data.history.length
      ? data.history[selectedCallIdx]
      : data;

  const handleCopy = () => {
    if (!activeCall) return;
    navigator.clipboard.writeText(activeCall.raw_response || '{}');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGemini = activeCall?.source === 'gemini';
  const isClaude = activeCall?.source === 'claude';
  const isLive = isGemini || isClaude;
  const statusTitle = isGemini
    ? 'Live Gemini AI Generation'
    : isClaude
    ? 'Live Claude AI Generation'
    : (activeCall?.attempts && activeCall.attempts.length > 0)
    ? 'Fallback: No Model Responded'
    : 'Deterministic Fallback Mode';

  const historyList = data?.history || [];
  const totalCalls = data?.total_calls ?? (historyList.length > 0 ? historyList.length : 1);
  const cumulativeTokens = data?.total_video_tokens ?? activeCall?.tokens?.total_tokens ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Output & Token Trace"
      subtitle="Inspect live Gemini model generation, token costs, and raw JSON payload"
      maxWidth="2xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-xs font-mono">Fetching AI telemetry...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-xs">
          {/* Multi-Call Navigation Track if multiple calls exist */}
          {historyList.length > 1 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">
                  Video AI Requests ({totalCalls} calls):
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {historyList.map((entry, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCallIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      selectedCallIdx === idx
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    #{idx + 1} {entry.purpose || `Call ${idx + 1}`} ({entry.tokens?.total_tokens ?? 0}t)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Header Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isLive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isLive ? <Sparkles className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    {statusTitle}
                  </span>
                  <Badge variant={isLive ? 'emerald' : 'amber'} size="sm">
                    {isLive ? (isGemini ? 'LIVE GEMINI' : 'LIVE CLAUDE') : 'FALLBACK'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Model: {activeCall?.model || 'deterministic_fallback'}
                  {activeCall && 'purpose' in activeCall && activeCall.purpose && (
                    <span className="text-cyan-400 ml-2 font-bold">
                      [{activeCall.purpose}]
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Token Summary Counters */}
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">Prompt</span>
                <span className="font-mono font-bold text-slate-200">
                  {activeCall?.tokens?.prompt_tokens ?? 0}
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">Completion</span>
                <span className="font-mono font-bold text-slate-200">
                  {activeCall?.tokens?.completion_tokens ?? 0}
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-center">
                <span className="text-[10px] text-cyan-400 block font-mono font-bold">
                  {historyList.length > 1 ? 'Call Tokens' : 'Total Tokens'}
                </span>
                <span className="font-mono font-black text-cyan-300">
                  {activeCall?.tokens?.total_tokens ?? 0}
                </span>
              </div>
              {historyList.length > 1 && (
                <div className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-purple-500/30 text-center">
                  <span className="text-[10px] text-purple-400 block font-mono font-bold">Cumulative</span>
                  <span className="font-mono font-black text-purple-300">
                    {cumulativeTokens}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Model Failover Chain */}
          {activeCall?.attempts && activeCall.attempts.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Model Failover Chain ({activeCall.attempts.length} attempts)
              </span>
              <div className="flex flex-col gap-1">
                {activeCall.attempts.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800/60"
                  >
                    <span className="text-slate-200 font-bold">{att.model}</span>
                    <span
                      className={
                        att.status === 'success'
                          ? 'text-emerald-400 font-bold'
                          : 'text-rose-400 text-[10px]'
                      }
                    >
                      {att.status.toUpperCase()}
                      {att.error ? ` • ${att.error.slice(0, 50)}...` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback Error / Info Banner */}
          {activeCall?.error && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Fallback Note:</span>
                <span className="text-[11px] text-amber-300/90 font-mono leading-relaxed">
                  {activeCall.error}
                </span>
              </div>
            </div>
          )}

          {/* Prompt Summary */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Prompt Summary</span>
            </label>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[11px] max-h-24 overflow-y-auto whitespace-pre-wrap">
              {activeCall?.prompt_summary || 'No prompt summary available.'}
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Raw JSON Returned By Model</span>
              </label>
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                className="h-6 px-2 text-[10px]"
              >
                {copied ? 'Copied to Clipboard' : 'Copy JSON'}
              </Button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed max-h-64 overflow-y-auto select-text">
              {loading ? 'Loading AI trace...' : activeCall?.raw_response || '{}'}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
};

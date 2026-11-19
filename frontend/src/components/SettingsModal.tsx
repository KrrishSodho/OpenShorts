import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, AlertCircle, Save, Check, Cpu } from 'lucide-react';
import { Modal, Button, Input, Select, Badge } from './ui';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_MODELS = [
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (Fast Ingest & Clip Discovery - Recommended)' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Deep Reasoning & On-Demand Motion FX)' },
  { value: 'claude-sonnet-5-5', label: 'Claude Sonnet 3.5 / 5.5 (Custom AI Scenes & Infographics)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [maskedAnthropicKey, setMaskedAnthropicKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setHasKey(Boolean(data.has_gemini_key));
        setMaskedKey(data.masked_key || '');
        setHasAnthropicKey(Boolean(data.has_anthropic_key));
        setMaskedAnthropicKey(data.masked_anthropic_key || '');
        if (data.selected_model) {
          setSelectedModel(data.selected_model);
        }
      })
      .catch(() => {
        setHasKey(false);
      });
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      const payload: { gemini_api_key?: string; anthropic_api_key?: string; selected_model?: string } = {
        selected_model: selectedModel,
      };
      if (apiKey.trim()) {
        payload.gemini_api_key = apiKey.trim();
      }
      if (anthropicKey.trim()) {
        payload.anthropic_api_key = anthropicKey.trim();
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setHasKey(Boolean(data.has_gemini_key));
        setMaskedKey(data.masked_key || 'Configured');
        setHasAnthropicKey(Boolean(data.has_anthropic_key));
        setMaskedAnthropicKey(data.masked_anthropic_key || 'Configured');
        setApiKey('');
        setAnthropicKey('');
        setSavedSuccess(true);
        setStatusMsg('Settings & AI Model updated successfully!');
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        setStatusMsg(data.detail || 'Failed to save settings');
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Studio Settings & API Keys"
      subtitle="Configure your BYO Gemini API Key for high-retention AI Director analysis"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Status Card */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                hasKey
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {hasKey ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">Gemini AI Director</span>
                <Badge variant={hasKey ? 'emerald' : 'amber'} size="sm">
                  {hasKey ? 'Configured' : 'Fallback Mode'}
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {hasKey ? `Active Key: ${maskedKey}` : 'Using local deterministic extractor'}
              </span>
            </div>
          </div>
        </div>

        {/* Gemini API Key Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google Gemini API Key</span>
          </label>
          <Input
            sizeVariant="md"
            type="password"
            placeholder={hasKey ? "Enter new key to replace active key..." : "AIzaSy..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-[10px] text-slate-500 font-mono">
            Powers fast ingest clip discovery & on-demand motion graphics. Stored locally.
          </p>
        </div>

        {/* Anthropic Claude API Key Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-violet-400" />
            <span>Anthropic Claude API Key (Optional)</span>
          </label>
          <Input
            sizeVariant="md"
            type="password"
            placeholder={hasAnthropicKey ? `Configured (${maskedAnthropicKey})` : "sk-ant-..."}
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
          />
          <p className="text-[10px] text-slate-500 font-mono">
            Optional: Powers custom Remotion sandbox scenes with Claude Sonnet 3.5 / 5.5.
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Director Model Engine</span>
          </label>
          <Select
            sizeVariant="md"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            options={DEFAULT_MODELS}
          />
          <p className="text-[10px] text-slate-500 font-mono">
            Stage 1 uses Gemini 3.5 Flash-Lite for fast viral discovery. Stage 2 uses Gemini 3.8 Flash / Claude for on-demand motion FX.
          </p>
        </div>

        {/* Action Button & Feedback */}
        <div className="flex items-center justify-between pt-2">
          {statusMsg ? (
            <span
              className={`text-[11px] font-mono ${
                savedSuccess ? 'text-emerald-400 font-bold' : 'text-rose-400'
              }`}
            >
              {statusMsg}
            </span>
          ) : <div />}

          <Button
            variant="accent"
            size="sm"
            disabled={saving}
            onClick={handleSave}
            leftIcon={
              savedSuccess ? (
                <Check className="w-3.5 h-3.5 text-slate-950" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )
            }
          >
            {saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

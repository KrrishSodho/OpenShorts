import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUT_GROUPS: { category: string; shortcuts: ShortcutItem[] }[] = [
  {
    category: 'Playback & Navigation',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause Video' },
      { keys: ['←', '→'], description: 'Step 1 Frame backward / forward' },
      { keys: ['Shift', '← / →'], description: 'Step 1 Second backward / forward' },
    ],
  },
  {
    category: 'Timeline Trimming',
    shortcuts: [
      { keys: ['I'], description: 'Set In-Point (Trim Start at Playhead)' },
      { keys: ['O'], description: 'Set Out-Point (Trim End at Playhead)' },
    ],
  },
  {
    category: 'Editing & History',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo last edit' },
      { keys: ['Ctrl', 'Y'], description: 'Redo last undone edit' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
    ],
  },
  {
    category: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Toggle Keyboard Shortcuts Modal' },
      { keys: ['Esc'], description: 'Close active modal / dialog' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      subtitle="Pro-NLE keyboard controls for fast scrubbing, editing, and trimming"
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 py-1">
        {SHORTCUT_GROUPS.map((grp) => (
          <div key={grp.category} className="flex flex-col gap-2">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
              {grp.category}
            </h4>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl divide-y divide-slate-800/80">
              {grp.shortcuts.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                >
                  <span className="text-slate-300 font-medium">{sc.description}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {sc.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[11px] font-bold text-slate-200 shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

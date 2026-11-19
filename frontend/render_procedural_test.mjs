// PATH: frontend/render_procedural_test.mjs
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { enableTailwind } from '@remotion/tailwind';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'qa_verified_screenshots', 'procedural_engine');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const proceduralMoments = [
  {
    time_sec: 1.0,
    duration_sec: 2.5,
    type: 'word_hit',
    procedural_scene: {
      version: '2.0',
      scene_id: 'proc_focal',
      time_sec: 1.0,
      duration_sec: 2.5,
      narrative_role: 'hook',
      purpose: 'Opening bold focal takeaway',
      visual_intent: 'focal_statement',
      word_range: [0, 4],
      nodes: [
        { id: 'n0', role: 'primary', text: 'SLEEP QUALITY IMPROVED' },
        { id: 'n1', role: 'secondary', text: 'AFTER SWITCHING TO DECAF' },
      ],
      spatial_zone: 'safe_center',
      backdrop_style: 'minimal_blur',
    },
  },
  {
    time_sec: 4.0,
    duration_sec: 2.8,
    type: 'contrast_split',
    procedural_scene: {
      version: '2.0',
      scene_id: 'proc_contrast',
      time_sec: 4.0,
      duration_sec: 2.8,
      narrative_role: 'turn',
      purpose: 'The accidental coffee mixup',
      visual_intent: 'comparison',
      word_range: [10, 16],
      nodes: [
        { id: 'n_left', role: 'primary', text: 'CAFFEINATED POD' },
        { id: 'n_right', role: 'counterpart', text: 'DECAF POD MIXUP' },
      ],
      connectors: [
        { from_id: 'n_left', to_id: 'n_right', type: 'vs_divider', label: 'VS' },
      ],
      spatial_zone: 'safe_center',
      backdrop_style: 'minimal_blur',
    },
  },
  {
    time_sec: 7.2,
    duration_sec: 2.6,
    type: 'metric_reveal',
    procedural_scene: {
      version: '2.0',
      scene_id: 'proc_metric',
      time_sec: 7.2,
      duration_sec: 2.6,
      narrative_role: 'payoff',
      purpose: 'Quantified result from speaker',
      visual_intent: 'stat_callout',
      word_range: [20, 24],
      nodes: [
        {
          id: 'n_stat',
          role: 'primary',
          text: 'MONTHS OF DRINKING CAFFEINE',
          metric: { value: '3', display_text: '3 MONTHS' },
        },
      ],
      spatial_zone: 'safe_center',
      backdrop_style: 'minimal_blur',
    },
  },
  {
    time_sec: 10.2,
    duration_sec: 2.8,
    type: 'pull_quote',
    procedural_scene: {
      version: '2.0',
      scene_id: 'proc_quote',
      time_sec: 10.2,
      duration_sec: 2.8,
      narrative_role: 'turn',
      purpose: 'Verbatim spoken realization',
      visual_intent: 'verbatim_quote',
      word_range: [30, 36],
      nodes: [
        { id: 'n_quote', role: 'primary', text: 'Wondering why I still felt awful before bed.' },
      ],
      spatial_zone: 'safe_center',
      backdrop_style: 'minimal_blur',
    },
  },
];

async function run() {
  console.log('Bundling Remotion index with Tailwind...');
  const entryPoint = fileURLToPath(new URL('./src/remotion/index.ts', import.meta.url));
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => enableTailwind(config),
  });

  const inputProps = {
    videoUrl: 'http://127.0.0.1:8000/storage/downloads/local_caffeine_46s.mp4',
    words: [
      { word: 'SLEEP', start: 0.2, end: 0.6 },
      { word: 'QUALITY', start: 0.6, end: 1.1 },
      { word: 'IMPROVED', start: 1.1, end: 1.8 },
      { word: 'AFTER', start: 1.8, end: 2.2 },
      { word: 'SWITCHING', start: 2.2, end: 2.8 },
      { word: 'CAFFEINE', start: 3.5, end: 4.2 },
      { word: 'VS', start: 4.3, end: 4.6 },
      { word: 'DECAF', start: 4.7, end: 5.5 },
      { word: 'THREE', start: 6.8, end: 7.4 },
      { word: 'MONTHS', start: 7.4, end: 8.2 },
      { word: 'AWFUL', start: 9.8, end: 11.2 },
    ],
    preset: {
      id: 'podcast_punch',
      name: 'Podcast Punch',
      theme_mode: 'editorial',
      primary_color: '#00F5FF',
      secondary_color: '#FFE600',
    },
    title: 'THE CAFFEINE EXPERIMENT',
    showTopHook: true,
    motionEvents: proceduralMoments,
    duration: 14.0,
    fps: 30,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MasterShortComposition',
    inputProps,
  });

  const targets = [
    { name: '01_procedural_focal.jpg', frame: 120 },     // 2.0s @ 60fps (Moment 0: 1.0s - 3.5s)
    { name: '02_procedural_contrast.jpg', frame: 320 },  // 5.3s @ 60fps (Moment 1: 4.0s - 6.8s)
    { name: '03_procedural_metric.jpg', frame: 500 },    // 8.3s @ 60fps (Moment 2: 7.2s - 9.8s)
    { name: '04_procedural_quote.jpg', frame: 680 },     // 11.3s @ 60fps (Moment 3: 10.2s - 13.0s)
  ];

  for (const t of targets) {
    const outPath = path.resolve(OUTPUT_DIR, t.name);
    console.log(`Rendering still frame ${t.frame} -> ${t.name}...`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outPath,
      frame: t.frame,
      inputProps,
      imageFormat: 'jpeg',
      onBrowserLog: (msg) => console.log('BROWSER LOG:', msg.text),
    });
    console.log(`Saved: ${outPath}`);
  }

  console.log('ALL PROCEDURAL TEST FRAMES RENDERED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});

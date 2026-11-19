import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderStill, renderMedia, selectComposition } from '@remotion/renderer';
import { enableTailwind } from '@remotion/tailwind';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'qa_verified_screenshots', 'motion_overhaul');
const VIDEO_OUTPUT = path.resolve(ROOT_DIR, 'qa_verified_screenshots', 'motion_showcase_v2.mp4');
const VIDEO_OUTPUT_COMPAT = path.resolve(ROOT_DIR, 'qa_verified_screenshots', 'motion_showcase.mp4');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const showcaseMotionEvents = [
  {
    type: 'vector_diagram',
    zone: 'top_stage',
    time_sec: 0.2,
    duration_sec: 2.8,
    label: 'DAILY ROUTINE',
    text: 'DECAF THROUGHOUT THE DAY',
    subtext: 'LEADS TO BETTER SLEEP',
    keywords: ['MORNING COFFEE', 'DECAF SWAP', 'DEEP SLEEP'],
    accent_color: '#00F5FF',
    text_size: 'md',
    transition: 'spring_slam',
    zoom: false,
  },
  {
    type: 'poster_slam',
    zone: 'center_spotlight',
    time_sec: 3.2,
    duration_sec: 2.6,
    label: 'KEY DISCOVERY',
    text: 'NEUROPLASTICITY',
    subtext: 'BRAIN ADAPTATION PROTOCOL',
    accent_color: '#FFE600',
    text_size: 'lg',
    transition: 'spring_slam',
    zoom: true,
  },
  {
    type: 'radial_gauge_stat',
    zone: 'top_stage',
    time_sec: 6.0,
    duration_sec: 2.6,
    label: 'EFFICIENCY GAIN',
    value: '94%',
    text: 'TOTAL RETENTION SURGE',
    subtext: 'MEASURED ACROSS 12 WEEKS',
    accent_color: '#10B981',
    text_size: 'md',
    transition: 'spring_slam',
    zoom: false,
  },
  {
    type: 'odometer_counter',
    zone: 'top_stage',
    time_sec: 8.8,
    duration_sec: 2.6,
    label: 'REVENUE VELOCITY',
    value: '8.4X',
    text: 'MONTHLY PIPELINE ACCELERATION',
    chart_values: [20, 45, 68, 95],
    accent_color: '#38BDF8',
    text_size: 'md',
    transition: 'spring_slam',
    zoom: false,
  },
  {
    type: 'spec_versus',
    zone: 'top_stage',
    time_sec: 11.6,
    duration_sec: 2.6,
    label: 'METHOD COMPARISON',
    headline: 'OLD APPROACH VS NEW ENGINE',
    left_item: 'MANUAL EDIT',
    right_item: 'VIRAL STUDIO',
    left_ratio: 28,
    right_ratio: 92,
    accent_color: '#EC4899',
    text_size: 'md',
    transition: 'spring_slam',
    zoom: false,
  },
  {
    type: 'quote_editorial_card',
    zone: 'bottom_stage',
    time_sec: 14.4,
    duration_sec: 2.8,
    label: 'EDITORIAL PULL-QUOTE',
    text: 'SIMPLICITY IS THE ULTIMATE SOPHISTICATION',
    headline: 'SIMPLICITY IS THE ULTIMATE SOPHISTICATION',
    subtext: 'DESIGN PHILOSOPHY',
    accent_color: '#F59E0B',
    text_size: 'md',
    transition: 'spring_slam',
    zoom: false,
  },
];

const sampleWords = [
  { word: 'Welcome', start: 0.1, end: 0.5 },
  { word: 'to', start: 0.5, end: 0.7 },
  { word: 'Viral', start: 0.7, end: 1.1 },
  { word: 'Studio', start: 1.1, end: 1.5 },
  { word: 'Pro', start: 1.5, end: 1.9 },
  { word: 'where', start: 2.1, end: 2.4 },
  { word: 'motion', start: 2.4, end: 2.8 },
  { word: 'graphics', start: 2.8, end: 3.3 },
  { word: 'feel', start: 3.5, end: 3.8 },
  { word: 'alive', start: 3.8, end: 4.3 },
  { word: 'with', start: 4.5, end: 4.8 },
  { word: 'continuous', start: 4.8, end: 5.4 },
  { word: 'physics', start: 5.4, end: 6.0 },
  { word: 'and', start: 6.2, end: 6.5 },
  { word: 'editorial', start: 6.5, end: 7.1 },
  { word: 'precision.', start: 7.1, end: 7.8 },
  { word: 'Watch', start: 8.0, end: 8.4 },
  { word: 'every', start: 8.4, end: 8.8 },
  { word: 'element', start: 8.8, end: 9.3 },
  { word: 'evolve', start: 9.3, end: 9.8 },
  { word: 'seamlessly', start: 9.8, end: 10.5 },
  { word: 'across', start: 10.7, end: 11.1 },
  { word: 'the', start: 11.1, end: 11.3 },
  { word: 'screen.', start: 11.3, end: 11.9 },
  { word: 'From', start: 12.1, end: 12.4 },
  { word: 'stats', start: 12.4, end: 12.8 },
  { word: 'to', start: 12.8, end: 13.0 },
  { word: 'timelines', start: 13.0, end: 13.6 },
  { word: 'and', start: 13.8, end: 14.1 },
  { word: 'split', start: 14.1, end: 14.5 },
  { word: 'cards,', start: 14.5, end: 15.0 },
  { word: 'perfection', start: 15.2, end: 15.8 },
  { word: 'in', start: 15.8, end: 16.0 },
  { word: 'every', start: 16.0, end: 16.4 },
  { word: 'frame.', start: 16.4, end: 17.2 },
];

const inputProps = {
  videoUrl: 'http://127.0.0.1:8000/storage/downloads/cinematic_showcase_bg.mp4',
  words: sampleWords,
  title: 'MOTION DESIGN SHOWCASE',
  showTopHook: true,
  preset: {
    id: 'fable_5_2_kinetic',
    name: 'Fable 5.2 Kinetic',
    palette: {
      primaryAccent: '#00F5FF',
      secondaryAccent: '#FFE600',
      textPrimary: '#FFFFFF',
      textMuted: '#94A3B8',
    },
    background: {
      baseColor: '#07090E',
      gridLineColor: '#121828',
    },
  },
  subtitleConfig: {
    style: 'tape_crimson',
    fontSize: 'md',
    position: 'bottom',
    maxWordsPerPhrase: 3,
    uppercase: true,
    highlightColor: 'yellow',
  },
  motionEvents: showcaseMotionEvents,
  videoVolume: 1.0,
  sfxEnabled: false,
  isExport: true,
};

async function run() {
  console.log('1. Bundling Remotion composition...');
  const entryPoint = fileURLToPath(new URL('./src/remotion/index.ts', import.meta.url));
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => enableTailwind(config),
  });

  console.log('2. Selecting composition...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MasterShortComposition',
    inputProps,
  });

  const fps = 60; // MasterShortComposition registered at 60 fps

  const keyframesToRender = [
    { name: 'vector_diagram_entry', frame: Math.round(0.6 * fps) },
    { name: 'vector_diagram_hold', frame: Math.round(1.5 * fps) },
    { name: 'poster_slam_hold', frame: Math.round(4.5 * fps) },
    { name: 'radial_gauge_hold', frame: Math.round(7.2 * fps) },
    { name: 'odometer_counter_hold', frame: Math.round(10.0 * fps) },
    { name: 'spec_versus_hold', frame: Math.round(12.8 * fps) },
    { name: 'quote_editorial_hold', frame: Math.round(15.8 * fps) },
  ];

  console.log('3. Rendering keyframe stills to qa_verified_screenshots/motion_overhaul/...');
  for (const kf of keyframesToRender) {
    const outPng = path.join(OUTPUT_DIR, `${kf.name}.png`);
    console.log(`   Rendering frame ${kf.frame} -> ${kf.name}.png`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outPng,
      frame: kf.frame,
      inputProps,
    });
  }

  console.log('4. Rendering compilation video: qa_verified_screenshots/motion_showcase.mp4...');
  const totalFrames = Math.round(17.5 * fps); // 17.5 seconds at 60fps = 1050 frames
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: VIDEO_OUTPUT,
    inputProps,
    frameRange: [0, totalFrames],
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct % 20 === 0) {
        console.log(`   Video render progress: ${pct}%`);
      }
    },
  });

  fs.copyFileSync(VIDEO_OUTPUT, VIDEO_OUTPUT_COMPAT);
  console.log(`Done! Showcase video successfully rendered at: ${VIDEO_OUTPUT} and ${VIDEO_OUTPUT_COMPAT}`);
}

run().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});

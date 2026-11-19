import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { enableTailwind } from '@remotion/tailwind';

const STORAGE_BASE =
  process.env.STORAGE_BASE_URL ||
  (process.env.API_BASE_URL ? process.env.API_BASE_URL.replace(/\/api\/?$/, '') : 'http://127.0.0.1:8000');

function absolutizeStorageUrl(url, base = STORAGE_BASE) {
  if (typeof url === 'string' && url.startsWith('/storage/')) {
    return `${base}${url}`;
  }
  return url;
}

async function main() {
  const [propsPath, outputPath] = process.argv.slice(2);
  if (!propsPath || !outputPath) {
    console.error('Usage: node render_short.mjs <props_json_path> <output_mp4_path>');
    process.exit(1);
  }

  const resolvedProps = path.resolve(propsPath);
  const resolvedOutput = path.resolve(outputPath);

  if (!fs.existsSync(resolvedProps)) {
    console.error(`Props file not found: ${resolvedProps}`);
    process.exit(1);
  }

  const inputProps = JSON.parse(fs.readFileSync(resolvedProps, 'utf-8'));

  const effectiveStorageBase = inputProps.storageBaseUrl || STORAGE_BASE;
  inputProps.storageBaseUrl = effectiveStorageBase;
  inputProps.isExport = true;

  if (inputProps.videoUrl) {
    inputProps.videoUrl = absolutizeStorageUrl(inputProps.videoUrl, effectiveStorageBase);
  }

  if (Array.isArray(inputProps.motionEvents)) {
    inputProps.motionEvents = inputProps.motionEvents.map((ev) => ({
      ...ev,
      broll_url: ev.broll_url ? absolutizeStorageUrl(ev.broll_url, effectiveStorageBase) : ev.broll_url,
    }));
  }

  console.log('PROGRESS:8:Bundling Remotion React + Tailwind layers...');
  const entryPoint = fileURLToPath(new URL('./src/remotion/index.ts', import.meta.url));
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => enableTailwind(config),
  });

  console.log('PROGRESS:18:Launching Headless Chromium Studio...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'MasterShortComposition',
    inputProps,
  });

  const durationSec = Number(inputProps.duration || 40);
  const fps = Number(inputProps.fps || 30);
  const durationInFrames = Math.max(30, Math.floor(durationSec * fps));

  const trimStart =
    typeof inputProps.trimStart === 'number' && Number.isFinite(inputProps.trimStart)
      ? Math.max(0, inputProps.trimStart)
      : 0;
  const trimEnd =
    typeof inputProps.trimEnd === 'number' && Number.isFinite(inputProps.trimEnd)
      ? Math.min(durationSec, inputProps.trimEnd)
      : durationSec;

  const isTrimmed = trimStart > 0.05 || trimEnd < durationSec - 0.05;
  const startFrame = Math.max(0, Math.floor(trimStart * fps));
  const endFrame = Math.min(
    durationInFrames - 1,
    Math.max(startFrame + 15, Math.floor(trimEnd * fps))
  );
  const targetFrameCount = isTrimmed ? endFrame - startFrame + 1 : durationInFrames;

  const targetComposition = {
    ...composition,
    durationInFrames,
    fps,
  };

  let lastReportedPct = 18;

  await renderMedia({
    composition: targetComposition,
    serveUrl: bundleLocation,
    codec: 'h264',
    imageFormat: 'jpeg',
    jpegQuality: 90,
    outputLocation: resolvedOutput,
    inputProps,
    crf: 21,
    pixelFormat: 'yuv420p',
    concurrency: 2,
    ...(isTrimmed ? { frameRange: [startFrame, endFrame] } : {}),
    onProgress: ({ renderedFrames, progress }) => {
      const uiPct = Math.min(99, Math.max(20, 20 + Math.round(progress * 79)));
      if (uiPct > lastReportedPct) {
        lastReportedPct = uiPct;
        console.log(
          `PROGRESS:${uiPct}:Rendering Remotion Motion & Subtitles (${renderedFrames}/${targetFrameCount} frames)`
        );
      }
    },
  });

  console.log('PROGRESS:100:Remotion MP4 Render Complete!');
}

main().catch((err) => {
  console.error('RENDER_ERROR:', err);
  process.exit(1);
});
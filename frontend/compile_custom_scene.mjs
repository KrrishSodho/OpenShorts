#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  let source = '';
  const argPath = process.argv[2];

  if (argPath && fs.existsSync(argPath)) {
    source = fs.readFileSync(argPath, 'utf-8');
  } else {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    source = Buffer.concat(chunks).toString('utf-8');
  }

  if (!source || !source.trim()) {
    console.log(JSON.stringify({ success: false, error: 'Empty source code provided' }));
    process.exit(1);
  }

  // Check if input was passed as JSON with { code: "..." }
  try {
    const parsed = JSON.parse(source);
    if (parsed && typeof parsed.code === 'string') {
      source = parsed.code;
    }
  } catch (_) {
    // Plain source code, proceed
  }

  try {
    const result = esbuild.transformSync(source, {
      loader: 'tsx',
      format: 'cjs',
      target: 'es2020',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    });

    console.log(
      JSON.stringify({
        success: true,
        code: result.code,
        warnings: result.warnings,
      })
    );
    process.exit(0);
  } catch (err) {
    console.log(
      JSON.stringify({
        success: false,
        error: err.message || String(err),
      })
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.log(JSON.stringify({ success: false, error: String(err) }));
  process.exit(1);
});

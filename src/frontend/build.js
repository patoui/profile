import * as esbuild from 'esbuild';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

const isWatch = process.argv.includes('--watch');

async function buildCSS() {
  console.log('Building CSS...');

  // Use Tailwind CLI to process CSS
  const command = isWatch
    ? 'npx tailwindcss -i ./css/main.css -o ../../public/dist/main.css --minify --watch'
    : 'npx tailwindcss -i ./css/main.css -o ../../public/dist/main.css --minify';

  if (isWatch) {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`CSS build error: ${error}`);
        return;
      }
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    });
    console.log('CSS watch mode started...');
  } else {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('✓ CSS built successfully');
  }
}

async function buildJS() {
  console.log('Building JavaScript...');

  // Ensure output directory exists
  await fs.mkdir('../../public/dist', { recursive: true });

  // Copy highlight.js CSS theme
  const highlightCSSSource = './node_modules/highlight.js/styles/github.min.css';
  const highlightCSSTarget = '../../public/dist/highlight.css';
  await fs.copyFile(highlightCSSSource, highlightCSSTarget);
  console.log('✓ Copied highlight.js CSS theme');

  const ctx = await esbuild.context({
    entryPoints: ['./js/highlight.js'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: '../../public/dist/highlight.js',
    format: 'iife',
    target: ['es2020'],
  });

  if (isWatch) {
    await ctx.watch();
    console.log('JS watch mode started...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('✓ JavaScript built successfully');
  }
}

async function build() {
  try {
    await buildCSS();
    await buildJS();

    if (!isWatch) {
      console.log('\n✨ All assets built successfully!');
      process.exit(0);
    } else {
      console.log('\n👀 Watching for changes...');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();

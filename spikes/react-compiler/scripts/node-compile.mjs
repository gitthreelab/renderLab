import * as Babel from '@babel/standalone';
import compiler from 'babel-plugin-react-compiler';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../fixture/App.tsx', import.meta.url), 'utf8');
const t = performance.now();
const out = Babel.transform(src, {
  filename: 'App.tsx',
  presets: [['typescript', { isTSX: true, allExtensions: true }]],
  plugins: [[compiler, { target: '19' }]],
  retainLines: false,
});
console.log(out.code);
console.log('ms', (performance.now() - t).toFixed(1));

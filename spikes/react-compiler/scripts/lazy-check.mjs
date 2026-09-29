// Comprueba en el build de producción (vite preview) que el chunk del compiler
// solo se descarga al activar el toggle. Uso: node scripts/lazy-check.mjs [base]
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5198';
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM || undefined });

async function run(compiler, toggleAfterLoad = false) {
  const page = await browser.newPage();
  const compileRequests = [];
  page.on('response', async (r) => {
    if (/\/assets\/compile-.*\.js$/.test(r.url())) compileRequests.push(r.url().split('/').pop());
  });
  await page.goto(`${base}/?route=precompile&compiler=${compiler ? 1 : 0}`);
  await page.waitForFunction(() => window.__metrics.readyMs !== null, null, { timeout: 120_000 });
  const m = await page.evaluate(() => window.__metrics);
  const result = { compiler, readyMs: Math.round(m.readyMs), compilerLoadMs: Math.round(m.compilerLoadMs), compileRequests: [...compileRequests] };
  if (toggleAfterLoad) {
    await page.check('#compiler'); // recarga con compiler=1
    await page.waitForFunction(() => window.__metrics.readyMs !== null && window.__metrics.compiler, null, { timeout: 120_000 });
    result.afterToggle = { compileRequests: [...compileRequests], compiledFunctions: await page.evaluate(() => window.__metrics.compiledFunctions) };
  }
  await page.close();
  return result;
}

for (let i = 0; i < 3; i++) console.log(JSON.stringify(await run(false, i === 0)));
for (let i = 0; i < 3; i++) console.log(JSON.stringify(await run(true)));
await browser.close();

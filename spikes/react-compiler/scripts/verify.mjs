// Verificación headless del prototipo. Uso:
//   node scripts/verify.mjs [base] [vía[,vía…]] [--edit]
// Ejecuta cada combinación compiler × StrictMode: carga, 2 clics, lee la sonda.
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5199';
const routes = (process.argv[3] ?? 'precompile').split(',');
const withEdit = process.argv.includes('--edit');
const IDS = ['Padre#1', 'HijoA#1', 'HijoB#1'];

// CHROMIUM: ruta a un headless shell ya instalado (evita descargar otro).
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM || undefined });

const pick = (counts) => IDS.map((id) => counts[id] ?? '-').join('/');

async function waitPadre(page, value) {
  await page.waitForFunction((v) => (window.__counts()['Padre#1'] ?? 0) >= v, value, { timeout: 30_000 });
  await page.waitForTimeout(600); // deja llegar el resto de mensajes del commit
}

async function clickTwice(page) {
  const button = page.frameLocator('#preview').getByRole('button', { name: 'Sumar' });
  const rows = [];
  const start = await page.evaluate(() => window.__counts()['Padre#1'] ?? 0);
  rows.push(pick(await page.evaluate(() => window.__counts())));
  for (let i = 1; i <= 2; i++) {
    await button.click();
    await waitPadre(page, start + i);
    rows.push(pick(await page.evaluate(() => window.__counts())));
  }
  return rows;
}

async function scenario(route, compiler, strict) {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  const url = `${base}/?route=${route}&compiler=${compiler ? 1 : 0}&strict=${strict ? 1 : 0}`;
  const timeout = route === 'nodebox' ? 300_000 : 120_000;
  const result = { route, compiler, strict };
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.__metrics.readyMs !== null, null, { timeout });
    await page.waitForTimeout(800);
    const [load, click1, click2] = await clickTwice(page);
    const m = await page.evaluate(() => window.__metrics);
    Object.assign(result, {
      load, click1, click2,
      readyMs: Math.round(m.readyMs),
      compilerLoadMs: Math.round(m.compilerLoadMs),
      compileMs: Math.round(m.compileMs),
      compiledFunctions: m.compiledFunctions,
    });

    if (withEdit) {
      // Edición en vivo: cambia el texto de HijoB en el editor y comprueba que la
      // preview ejecuta el código nuevo y sigue compilado (HijoB no sube).
      const edited = (await page.inputValue('#editor')).replace('HijoB: sin props', 'HijoB: editado');
      await page.fill('#editor', edited);
      const t = Date.now();
      await page.frameLocator('#preview').getByText('HijoB: editado').waitFor({ timeout: 60_000 });
      result.editVisibleMs = Date.now() - t;
      await page.waitForTimeout(800);
      // Sin reset: tras un reset, un HijoB memoizado no vuelve a informar (sale «-»).
      const [e0, e1, e2] = await clickTwice(page);
      const after = await page.evaluate(() => window.__metrics);
      Object.assign(result, {
        editLoad: e0, editClick1: e1, editClick2: e2,
        editAllCounts: await page.evaluate(() => window.__counts()),
        editCompiledFunctions: after.compiledFunctions, edits: after.edits,
      });

      // Segunda edición, en Padre: con Fast Refresh, una caché de memo conservada
      // dejaría el botón con la etiqueta vieja hasta que cambiase count.
      const relabeled = (await page.inputValue('#editor')).replace('>Sumar<', '>Sumar uno<');
      await page.fill('#editor', relabeled);
      try {
        await page.frameLocator('#preview').getByRole('button', { name: 'Sumar uno' }).waitFor({ timeout: 15_000 });
        result.padreEditVisible = true;
      } catch {
        result.padreEditVisible = false;
      }
      result.afterPadreEdit = await page.evaluate(() => window.__counts());
    }
    const final = await page.evaluate(() => window.__metrics);
    result.errors = [...final.sandpackErrors, ...final.compileErrors, ...consoleErrors];
  } catch (error) {
    const m = await page.evaluate(() => window.__metrics).catch(() => ({}));
    result.failed = String(error).split('\n')[0];
    result.errors = [...(m.sandpackErrors ?? []), ...consoleErrors];
    result.counts = await page.evaluate(() => window.__counts()).catch(() => ({}));
    result.log = await page.textContent('#log').catch(() => '');
    await page.screenshot({ path: `${process.env.SHOTS ?? '.'}/fail-${route}-${compiler}-${strict}.png` }).catch(() => {});
  }
  await page.close();
  console.log(JSON.stringify(result));
  return result;
}

for (const route of routes) {
  for (const compiler of [false, true]) {
    for (const strict of [false, true]) {
      await scenario(route, compiler, strict);
    }
  }
}
await browser.close();

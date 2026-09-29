import { expect, test, type Page } from '@playwright/test';
import { parseProbeEvent } from '@render-lab/protocol';
import { COMPILER_FIXTURE, OPT_OUT_FIXTURE } from './fixtures/compilerProbe';

const RECIPE_URL = '/recetas/estado-compartido';
// En dev, Vite sirve el código React de la receta como un módulo `?raw`.
const RECIPE_APP_MODULE = /\/recipes\/estado-compartido\/react\/App\.tsx\?(.*&)?raw\b/;
// Módulos del compiler en dev: el del lab y los dos paquetes pre-empaquetados.
const COMPILER_REQUEST = /reactCompiler|processShim|@babel_standalone|babel-plugin-react-compiler/;
const READY_TIMEOUT = 90_000;

type Counts = Record<string, number>;

async function openRecipe(page: Page, fixture: string) {
  await page.route(RECIPE_APP_MODULE, (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `export default ${JSON.stringify(fixture)};`,
    }),
  );
  // Guarda todo lo que llega por postMessage; se valida después con el schema.
  await page.addInitScript(() => {
    const messages: unknown[] = [];
    Object.assign(window, { __labMessages: messages });
    window.addEventListener('message', (event: MessageEvent<unknown>) => {
      messages.push(event.data);
    });
  });
  await page.goto(RECIPE_URL);
}

// Último contador por instancia de React (misma lógica que useProbeCounts).
async function probeCounts(page: Page): Promise<Counts> {
  const messages = await page.evaluate(() => {
    const store: unknown = Reflect.get(window, '__labMessages');
    return Array.isArray(store) ? [...store] : [];
  });
  const counts: Counts = {};
  for (const message of messages) {
    const result = parseProbeEvent(message);
    if (result.ok && result.data.framework === 'react') {
      counts[result.data.instanceId] = result.data.count;
    }
  }
  return counts;
}

async function clearProbeMessages(page: Page) {
  await page.evaluate(() => {
    const store: unknown = Reflect.get(window, '__labMessages');
    if (Array.isArray(store)) store.length = 0;
  });
}

function row(counts: Counts): [number?, number?, number?] {
  return [counts['Padre#1'], counts['HijoA#1'], counts['HijoB#1']];
}

async function expectRow(page: Page, expected: [number, number, number]) {
  await expect
    .poll(async () => row(await probeCounts(page)), { timeout: READY_TIMEOUT })
    .toEqual(expected);
}

async function expectScoreboardMatchesProbe(page: Page) {
  const total = Object.values(await probeCounts(page)).reduce((sum, count) => sum + count, 0);
  await expect(page.getByText(/^React \d+ renders$/)).toHaveText(`React ${total} renders`);
}

// Avisos del lab sobre el compiler (Sandpack tiene sus propios role="alert").
function compilerWarning(page: Page) {
  return page.getByRole('alert').filter({ hasText: 'Aviso:' });
}

function preview(page: Page) {
  return page.frameLocator('iframe.sp-preview-iframe');
}

async function clickSumar(page: Page) {
  await preview(page).getByRole('button', { name: 'Sumar' }).click();
}

async function setToggles(page: Page, toggles: { strictMode: boolean; compiler: boolean }) {
  // Se espera al sandbox inicial para que no lleguen mensajes suyos tras limpiar.
  await expectRow(page, [1, 1, 1]);
  if (!toggles.strictMode && !toggles.compiler) return;
  if (toggles.strictMode) await page.getByRole('checkbox', { name: 'StrictMode' }).check();
  if (toggles.compiler) await page.getByRole('checkbox', { name: 'React Compiler' }).check();
  await clearProbeMessages(page);
}

// Editor de Sandpack: selecciona todo e inserta el texto de golpe (sin
// autocierre de llaves ni autoindentado), como pegar el fichero entero.
async function replaceEditorCode(page: Page, code: string) {
  await page.locator('.sp-code-editor .cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
}

const CASES = [
  { name: 'sin compiler', strictMode: false, compiler: false, hijoB: [1, 2, 3] },
  { name: 'sin compiler + StrictMode', strictMode: true, compiler: false, hijoB: [1, 2, 3] },
  { name: 'con compiler', strictMode: false, compiler: true, hijoB: [1, 1, 1] },
  { name: 'con compiler + StrictMode', strictMode: true, compiler: true, hijoB: [1, 1, 1] },
] as const;

for (const { name, strictMode, compiler, hijoB } of CASES) {
  test(`sonda Padre/HijoA/HijoB: ${name}`, async ({ page }) => {
    await openRecipe(page, COMPILER_FIXTURE);
    await setToggles(page, { strictMode, compiler });

    await expectRow(page, [1, 1, hijoB[0]]);
    if (compiler) {
      await expect(page.getByText('React Compiler: 4 componentes compilados.')).toBeVisible();
    }
    await expect(compilerWarning(page)).toHaveCount(0);

    await clickSumar(page);
    await expectRow(page, [2, 2, hijoB[1]]);
    await clickSumar(page);
    await expectRow(page, [3, 3, hijoB[2]]);

    // App no depende del estado de Padre: se queda en 1 (StrictMode no cuenta doble).
    expect((await probeCounts(page))['App#1']).toBe(1);
    await expectScoreboardMatchesProbe(page);
  });
}

test('edición en vivo con el compiler activo', async ({ page }) => {
  await openRecipe(page, COMPILER_FIXTURE);
  await setToggles(page, { strictMode: false, compiler: true });
  await expectRow(page, [1, 1, 1]);
  await clickSumar(page);
  await clickSumar(page);
  await expectRow(page, [3, 3, 1]);

  const startedAt = Date.now();
  await replaceEditorCode(page, COMPILER_FIXTURE.replace('HijoB: sin props', 'HijoB: editado'));
  await expect(preview(page).getByText('HijoB: editado')).toBeVisible({ timeout: 30_000 });
  const editMs = Date.now() - startedAt;

  // Fast Refresh: todas las instancias conservan su id y cuentan +1.
  await expectRow(page, [4, 4, 2]);
  await expect(page.getByText('React Compiler: 4 componentes compilados.')).toBeVisible();

  // Tras la edición, HijoB sigue memoizado: el código compilado es el nuevo.
  await clickSumar(page);
  await clickSumar(page);
  await expectRow(page, [6, 6, 2]);
  await expectScoreboardMatchesProbe(page);

  test.info().annotations.push({ type: 'edición visible en', description: `${editMs} ms` });
});

test('avisa si el compiler no compila ningún componente', async ({ page }) => {
  await openRecipe(page, OPT_OUT_FIXTURE);
  await setToggles(page, { strictMode: false, compiler: true });

  await expect(page.getByText('React Compiler: 0 componentes compilados.')).toBeVisible();
  await expect(compilerWarning(page)).toContainText('no ha compilado ningún componente');
  await expect(compilerWarning(page)).toContainText('SIN optimizar');

  // Y la sonda lo confirma: HijoB vuelve a renderizar.
  await expectRow(page, [1, 1, 1]);
  await clickSumar(page);
  await expectRow(page, [2, 2, 2]);
});

test('avisa si la compilación falla mientras se edita', async ({ page }) => {
  await openRecipe(page, COMPILER_FIXTURE);
  await setToggles(page, { strictMode: false, compiler: true });
  await expect(page.getByText('React Compiler: 4 componentes compilados.')).toBeVisible();

  await replaceEditorCode(page, COMPILER_FIXTURE.replace('<HijoB />', '<HijoB'));
  await expect(compilerWarning(page)).toContainText('la compilación ha fallado');
  await expect(page.getByText('React Compiler: 0 componentes compilados.')).toBeVisible();

  await replaceEditorCode(page, COMPILER_FIXTURE);
  await expect(page.getByText('React Compiler: 4 componentes compilados.')).toBeVisible();
  await expect(compilerWarning(page)).toHaveCount(0);
});

test('con el toggle apagado no se descarga nada del compiler', async ({ page }) => {
  const compilerRequests: string[] = [];
  page.on('request', (request) => {
    if (COMPILER_REQUEST.test(request.url())) compilerRequests.push(request.url());
  });

  await openRecipe(page, COMPILER_FIXTURE);
  await expectRow(page, [1, 1, 1]);
  await clickSumar(page);
  await expectRow(page, [2, 2, 2]);
  expect(compilerRequests).toEqual([]);

  await page.getByRole('checkbox', { name: 'React Compiler' }).check();
  await expect(page.getByText('React Compiler: 4 componentes compilados.')).toBeVisible({
    timeout: READY_TIMEOUT,
  });
  expect(compilerRequests.length).toBeGreaterThan(0);
});

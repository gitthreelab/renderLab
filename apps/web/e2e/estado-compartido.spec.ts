import { expect, test, type Page } from '@playwright/test';
import { parseProbeEvent } from '@render-lab/protocol';

// Diferencia central de las recetas de estado compartido: con Context, VerNombre
// se re-renderiza en cada clic aunque no lea el contador; con Zustand y un
// selector por componente, se queda en 1. Usa el código real de las recetas.
const READY_TIMEOUT = 90_000;

type Counts = Record<string, number>;

async function openRecipe(page: Page, slug: string) {
  await page.addInitScript(() => {
    const messages: unknown[] = [];
    Object.assign(window, { __labMessages: messages });
    window.addEventListener('message', (event: MessageEvent<unknown>) => {
      messages.push(event.data);
    });
  });
  await page.goto(`/recetas/${slug}`);
  // Sandpack arranca solo cuando el sandbox es visible; el texto de la receta lo
  // deja por debajo del viewport.
  await page.locator('.sp-layout').scrollIntoViewIfNeeded();
}

// Último contador por instancia de React (misma lógica que useProbeCounts).
async function reactCounts(page: Page): Promise<Counts> {
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

async function expectCounts(page: Page, verContador: number, verNombre: number) {
  await expect
    .poll(
      async () => {
        const counts = await reactCounts(page);
        return [counts['VerContador#1'], counts['VerNombre#1']];
      },
      { timeout: READY_TIMEOUT },
    )
    .toEqual([verContador, verNombre]);
}

const CASES = [
  { slug: 'estado-compartido', verNombre: [1, 2, 3] },
  { slug: 'estado-compartido-zustand', verNombre: [1, 1, 1] },
] as const;

for (const { slug, verNombre } of CASES) {
  test(`${slug}: VerNombre va a ${verNombre.join('/')} en 2 clics`, async ({ page }) => {
    test.setTimeout(3 * READY_TIMEOUT);
    await openRecipe(page, slug);
    const preview = page.frameLocator('iframe.sp-preview-iframe');

    await expectCounts(page, 1, verNombre[0]);
    await preview.getByRole('button', { name: 'Sumar' }).click();
    await expectCounts(page, 2, verNombre[1]);
    await preview.getByRole('button', { name: 'Sumar' }).click();
    await expectCounts(page, 3, verNombre[2]);
    await expect(preview.getByText('Contador: 2')).toBeVisible();
  });
}

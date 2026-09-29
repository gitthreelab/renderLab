// @vitest-environment jsdom
import { getCounts } from './index';
import { act, memo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test } from 'vitest';

function HijoA({ count }: { count: number }) {
  return <p>{count}</p>;
}

const HijoB = memo(function HijoB() {
  return <p>Estático</p>;
});

function Padre() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Sumar</button>
      <HijoA count={count} />
      <HijoA count={count} />
      <HijoB />
    </div>
  );
}

function countOf(instanceId: string) {
  return getCounts().find((c) => c.instanceId === instanceId)?.count;
}

test('cuenta por instancia y respeta memo', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => root.render(<Padre />));

  const button = container.querySelector('button');
  if (!button) throw new Error('No hay botón');
  await act(async () => button.click());

  expect(countOf('Padre#1')).toBe(2);
  expect(countOf('HijoA#1')).toBe(2);
  expect(countOf('HijoA#2')).toBe(2);
  expect(countOf('HijoB#1')).toBe(1);

  await act(async () => root.unmount());
});

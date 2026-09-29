import type { Fiber } from 'bippy';

const ids = new WeakMap<Fiber, string>();
const nextNumberByName = new Map<string, number>();

export function instanceIdOf(fiber: Fiber, name: string): string {
  const known = ids.get(fiber) ?? (fiber.alternate ? ids.get(fiber.alternate) : undefined);
  if (known) {
    ids.set(fiber, known);
    return known;
  }

  const number = (nextNumberByName.get(name) ?? 0) + 1;
  nextNumberByName.set(name, number);
  const id = `${name}#${number}`;

  ids.set(fiber, id);
  if (fiber.alternate) ids.set(fiber.alternate, id);
  return id;
}

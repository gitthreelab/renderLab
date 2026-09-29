import { z } from 'zod';
import { LabCommandSchema, ProbeEventSchema, type LabCommand, type ProbeEvent } from './messages';
import { RecipeMetaSchema, type RecipeMeta } from './recipe';

/** Resultado de un parseo que nunca lanza. */
export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

function safeParse<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, error: z.prettifyError(result.error) };
}

export function parseRecipeMeta(input: unknown): ParseResult<RecipeMeta> {
  return safeParse(RecipeMetaSchema, input);
}

export function parseProbeEvent(input: unknown): ParseResult<ProbeEvent> {
  return safeParse(ProbeEventSchema, input);
}

export function parseLabCommand(input: unknown): ParseResult<LabCommand> {
  return safeParse(LabCommandSchema, input);
}

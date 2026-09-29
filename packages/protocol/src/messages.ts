import { z } from 'zod';

/** Marca común de todos los mensajes de Render Lab entre iframes y lab. */
export const MESSAGE_SOURCE = 'render-lab';

export const FRAMEWORKS = ['react', 'angular'] as const;

export const FrameworkSchema = z.enum(FRAMEWORKS);

export type Framework = z.infer<typeof FrameworkSchema>;

/** iframe → lab: contador actual de una instancia de componente. */
export const ProbeEventSchema = z.object({
  source: z.literal(MESSAGE_SOURCE),
  framework: FrameworkSchema,
  /** Nombre del componente (en Angular, su selector). */
  component: z.string().min(1),
  /** Identifica la instancia: se cuenta por instancia, no por componente. */
  instanceId: z.string().min(1),
  count: z.int().nonnegative(),
});

export type ProbeEvent = z.infer<typeof ProbeEventSchema>;

/** lab → iframe: órdenes del marcador. */
export const LabCommandSchema = z.object({
  source: z.literal(MESSAGE_SOURCE),
  type: z.literal('reset'),
});

export type LabCommand = z.infer<typeof LabCommandSchema>;

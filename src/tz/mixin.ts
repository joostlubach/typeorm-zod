import { z } from 'zod'

export function mixin<S, T, A extends any[]>(
  schema: z.ZodType<S>,
  base: new (...args: A) => T
) {
  return base as new (...args: A) => T & z.infer<typeof schema>
}
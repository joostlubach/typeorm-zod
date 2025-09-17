import { z } from 'zod'

import { Column } from '../column'

export function json<T>(base: z.ZodType<T>): Column<z.ZodType<T>> {
  return new Column(base, {type: 'json'})
}

export function jsonb<T>(base: z.ZodType<T>): Column<z.ZodType<T>> {
  return new Column(base, {type: 'jsonb'})
}
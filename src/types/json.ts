import { z } from 'zod'

import { column, defineColumnType } from '../column'

export function json<T>(base: z.ZodType<T>): column<z.ZodType<T>> {
  return defineColumnType(base, {
    type: 'json',
  })
}

export function jsonb<T>(base: z.ZodType<T>): column<z.ZodType<T>> {
  return defineColumnType(base, {
    type: 'jsonb',
  })
}
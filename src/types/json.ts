import { z } from 'zod'

import { column, createColumnType } from '../column'

export function json<T>(base: z.ZodType<T>): column<z.ZodType<T>> {
  return createColumnType(base, {
    type: 'json',
  })
}

export function jsonb<T>(base: z.ZodType<T>): column<z.ZodType<T>> {
  return createColumnType(base, {
    type: 'jsonb',
  })
}
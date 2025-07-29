import { z } from 'zod'

import { ColumnTypeModifiers, createColumnType } from '../column'

export function json<T>(base: z.ZodType<T>): z.ZodType<T> & ColumnTypeModifiers {
  return createColumnType(base, {
    type: 'json',
  })
}

export function jsonb<T>(base: z.ZodType<T>): z.ZodType<T> & ColumnTypeModifiers {
  return createColumnType(base, {
    type: 'jsonb',
  })
}
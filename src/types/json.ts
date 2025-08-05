import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'

export function json<T>(base: z.ZodType<T>): ColumnType<z.ZodType<T>> {
  return buildColumnType(base, {
    options: {
      type: 'json',
    }
  })
}

export function jsonb<T>(base: z.ZodType<T>): ColumnType<z.ZodType<T>> {
  return buildColumnType(base, {
    options: {
      type: 'jsonb',
    }
  })
}
import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { ColumnTypeModifiers, createColumnType } from '../column'

export function array<T>(type: `${string}[]`, base: z.ZodType<T>): z.ZodArray<z.ZodType<T>> & ColumnTypeModifiers {
  return createColumnType(z.array(base), {
    type: type as ColumnType
  })
}
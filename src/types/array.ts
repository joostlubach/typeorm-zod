import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { column, defineColumnType } from '../column'

export function array<T>(type: `${string}[]`, base: z.ZodType<T>): column<z.ZodArray<z.ZodType<T>>> {
  return defineColumnType(z.array(base), {
    type: type as ColumnType
  })
}
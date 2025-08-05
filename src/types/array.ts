import { ColumnType as typeorm_ColumnType } from 'typeorm'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'

export function array<T>(type: `${string}[]`, base: z.ZodType<T>): ColumnType<z.ZodArray<z.ZodType<T>>> {
  return buildColumnType(z.array(base), {
    options: {
      type: type as typeorm_ColumnType
    }
  })
}
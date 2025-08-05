import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'

export function boolean(): ColumnType<z.ZodBoolean> {
  return buildColumnType(z.boolean(), {
    options: {
      type: 'boolean',
    },
  })
}
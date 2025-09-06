import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { buildColumnType } from '../column'

export function column(type: ColumnType) {
  return buildColumnType(z.any(), {
    options: {
      type,
    },
  })
}
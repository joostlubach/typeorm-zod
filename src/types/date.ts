import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { buildColumnType } from '../column'

export function date(type?: ColumnType) {
  return buildColumnType(z.date(), {
    options: {
      type,
    },
  })
}
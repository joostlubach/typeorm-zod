import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { buildColumnType } from '../column'

export function binary(type: ColumnType = 'blob') {
  return buildColumnType(z.instanceof(Uint8Array), {
    options: {
      type,
    },
  })
}
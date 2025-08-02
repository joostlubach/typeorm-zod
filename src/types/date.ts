import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { createColumnType } from '../column'

export function date(type?: ColumnType) {
  return createColumnType(z.date(), {type})
}
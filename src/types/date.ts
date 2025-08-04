import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { defineColumnType } from '../column'

export function date(type?: ColumnType) {
  return defineColumnType(z.date(), {type})
}
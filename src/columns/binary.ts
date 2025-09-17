import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { Column, ColumnOptions } from '../column'

export function binary(type: ColumnType = 'blob', options?: ColumnOptions) {
  return new Column(z.instanceof(Uint8Array), {type, ...options})
}
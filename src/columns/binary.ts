import { ColumnType } from 'typeorm'
import { z } from 'zod'

import { Column, ColumnOptions } from '../column'
import config from '../config'

export function binary(type: ColumnType = config.typemap.binary, options?: ColumnOptions) {
  return new Column(z.instanceof(Uint8Array), {type, ...options})
}
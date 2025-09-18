import { z } from 'zod'

import { Column, ColumnOptions } from '../column'
import config from '../config'

export function boolean(options?: ColumnOptions): Column<z.ZodBoolean> {
  return new BooleanColumn(options)
}

export class BooleanColumn extends Column<z.ZodBoolean> {

  constructor(options?: ColumnOptions) {
    super(z.boolean(), {
      type: config.typemap.boolean,
      ...options,
    })
  }

}
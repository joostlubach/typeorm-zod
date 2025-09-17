import { z } from 'zod'

import { Column, ColumnOptions, ColumnType } from '../column'
import config from '../config'

export function date(options?: ColumnType | ColumnOptions) {
  return new DateColumn(options)
}

export class DateColumn extends Column<z.ZodDate> {

  constructor(
    options?: ColumnOptions
  ) {
    super(z.date(), {
      type: config.typemap.date,
      ...options
    })
  }

}
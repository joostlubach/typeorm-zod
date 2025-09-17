import { z } from 'zod'

import { Column, ColumnOptions, ColumnType } from '../column'

export function date(typeOrOptions?: ColumnType | ColumnOptions) {
  return new DateColumn(typeOrOptions)
}

export class DateColumn extends Column<z.ZodDate> {

  constructor(
    typeOrOptions?: ColumnType | ColumnOptions
  ) {
    super(z.date(), typeOrOptions)
  }

}
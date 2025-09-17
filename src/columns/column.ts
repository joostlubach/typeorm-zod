import { z } from 'zod'

import { Column, ColumnOptions, ColumnType } from '../column'

export function column<T extends z.ZodType<any>>(base: T, typeOrOptions?: ColumnType | ColumnOptions): Column<T> {
  return new Column(base, typeOrOptions)
}
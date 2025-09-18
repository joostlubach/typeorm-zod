import { z } from 'zod'

import { Column, ColumnOptions, ColumnType } from '../column'
import config from '../config'

export function string<T extends z.ZodString>(base: T, type?: ColumnType, options?: ColumnOptions): StringColumn<T>
export function string<T extends z.ZodType<string>>(base: T, type?: ColumnType, options?: ColumnOptions): Column<T>
export function string(type?: ColumnType, options?: ColumnOptions): StringColumn<z.ZodString>
export function string(...args: any[]): StringColumn<z.ZodString> | Column<z.ZodType<string>> {
  const base = args[0] instanceof z.ZodType ? args.shift() : z.string()
  const type = args.shift() ?? config.typemap.string
  const options = args.shift() ?? {}

  if (base instanceof z.ZodString) {
    return new StringColumn(base, {type, ...options})
  } else {
    return new Column(base, {type, ...options})
  }
}

export class StringColumn<T extends z.ZodString = z.ZodString> extends Column<T> {

  constructor(base: T, typeOrOptions?: ColumnType | ColumnOptions) {
    super(base, typeOrOptions)
    this.min(1)
  }

  public optional() {
    this.min(0)
    return super.optional()
  }

  public nullable() {
    this.min(0)
    return super.nullable()
  }

  public min(minLength: number) {
    this.modify(this.zod.min(minLength))
    return this
  }

  public max(maxLength: number) {
    this.modify(this.zod.max(maxLength))
    if (typeof this.options.length === 'number') {
      this.options.length = Math.min(this.options.length, maxLength)
    } else {
      this.options.length = maxLength
    }
    return this
  }

  public length(length: number) {
    this.min(length).max(length)
    return this
  }

  public collate(collation: string) {
    this.options.collation = collation
    return this
  }

  public ignoreCase() {
    this.options.collation = config.collation.ignoreCase
    return this
  }

}
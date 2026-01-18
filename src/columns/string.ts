import { cleanTextValue } from 'ytil'
import { z } from 'zod'

import { Column, ColumnOptions, ColumnType, NullableColumn } from '../column'
import config from '../config'

export function string<T extends z.ZodString>(base: T, type?: ColumnType, options?: ColumnOptions): StringColumn<T>
export function string<T extends z.ZodType<string>>(base: T, type?: ColumnType, options?: ColumnOptions): Column<T>
export function string<T extends z.ZodType>(base: T, type?: ColumnType, options?: ColumnOptions): StringColumn<z.ZodString>
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

  public optional() {
    return this.nullable().default(null)
  }

  public nullable(): NullableColumn<this> {
    const modified = this.modify(z => z.transform(it => cleanTextValue(it, true)) as any)
    return super.nullable.call(modified)
  }

  public min(minLength: number) {
    return this.modify(z => z.min(minLength))
  }

  public max(maxLength: number) {
    const modified = this.modify(z => z.max(maxLength))
    if (typeof modified.options.length === 'number') {
      modified.options.length = Math.min(modified.options.length, maxLength)
    } else {
      modified.options.length = maxLength
    }
    return modified
  }

  public length(length: number) {
    return this.min(length).max(length)
  }

  public collate(collation: string) {
    const modified = this.modify(z => z)
    modified.options.collation = collation
    return modified
  }

  public ignoreCase() {
    const modified = this.modify(z => z)
    modified.options.collation = config.collation.ignoreCase
    return modified
  }

}
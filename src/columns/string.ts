import { isPlainObject } from 'ytil'
import { z } from 'zod'

import { Column, ColumnOptions, ColumnType } from '../column'
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

  constructor(base: T, typeOrOptions?: ColumnType | ColumnOptions) {
    // We add a minimum length of 1 to string columns by default, unless they are optional or nullable.
    // This is set back to 0 when calling `.optional()` or `.nullable()`.
    if (!(isPlainObject<ColumnOptions>(typeOrOptions) && typeOrOptions.nullable)) {
      base = base.min(1)
    }
    super(base, typeOrOptions)
  }

  public optional() {
    const superOptional = super.optional
    return superOptional.call(this.modify(z => z.min(0)))
  }

  public nullable() {
    const superNullable = super.nullable
    return superNullable.call(this.modify(z => z.min(0)))
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
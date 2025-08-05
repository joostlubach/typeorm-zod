import { ColumnOptions } from 'typeorm'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import { modifyColumnOptions } from '../registry'

export function string(type?: 'varchar' | 'text', options: ColumnOptions = {}): StringColumn {
  return buildColumnType(z.string(), {
    options: {
      type: type ?? 'varchar',
      ...options,
    },
    modifiers,
  })
}

function max<T extends z.ZodString>(this: T, maxLength: number) {
  const modified = this.max(maxLength)
  modifyColumnOptions(modified, opts => ({...opts, length: maxLength}))
  return modified
}

function length<T extends z.ZodString>(this: T, length: number) {
  const modified = this.length(length)
  modifyColumnOptions(modified, opts => ({...opts, length}))
  return modified
}

function collate<T extends z.ZodString>(this: T, collation: string) {
  modifyColumnOptions(this, opts => ({...opts, collation}))
  return this
}

const modifiers = {
  max,
  length,
  collate,
}

export type StringModifiers = typeof modifiers
export type StringColumn = ColumnType<z.ZodString, StringModifiers>
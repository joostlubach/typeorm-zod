import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import { modifyColumnOptions } from '../registry'

export function string(type?: 'varchar' | 'text'): StringColumn {
  return buildColumnType(z.string(), {
    options: {
      type: type ?? 'varchar',
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

const modifiers = {
  max,
  length,
}

export type StringModifiers = typeof modifiers
export type StringColumn = ColumnType<z.ZodString, StringModifiers>
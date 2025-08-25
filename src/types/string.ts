import { ColumnOptions } from 'typeorm'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import config from '../config'
import { modifyColumnOptions } from '../registry'

export function string<S extends string>(from: z.ZodType<S>, type?: 'varchar' | 'text', options?: ColumnOptions): StringColumn
export function string(type?: 'varchar' | 'text', options?: ColumnOptions): StringColumn
export function string(...args: any[]): StringColumn {
  const from = args[0] instanceof z.ZodType ? args.shift() : z.string()
  const type = args.shift() ?? 'varchar'
  const options = args.shift() ?? {}

  return buildColumnType(from, {
    options: {
      type,
      ...options,
    },
    modifiers,
  }).min(1)
}

const {
  optional: orig_optional,
  nullable: orig_nullable,
} = z.string()

function optional<T extends z.ZodString>(this: T) {
  return orig_optional.call(this.min(0))
}

function nullable<T extends z.ZodString>(this: T) {
  return orig_nullable.call(this.min(0))
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

function ignoreCase<T extends z.ZodString>(this: T) {
  modifyColumnOptions(this, opts => ({...opts, collation: config.collation.ignoreCase}))
  return this
}

const modifiers = {
  optional,
  nullable,
  max,
  length,
  collate,
  ignoreCase,
}

export type StringModifiers = typeof modifiers
export type StringColumn = ColumnType<z.ZodString, StringModifiers>
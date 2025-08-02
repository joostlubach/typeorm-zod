import { z } from 'zod'

import { column, createColumnType, modifyColumn } from '../column'

export function string(type?: 'varchar' | 'text'): StringColumn {
  return createColumnType(z.string(), {
    type: type ?? 'varchar'
  }, modifiers)
}

const orig_max = z.string().max
function max(this: z.ZodString, maxLength: number): StringColumn {
  return modifyColumn(
    this,
    base => orig_max.call(base, maxLength),
    options => ({...options, length: maxLength}),
    modifiers
  )
}

const orig_min = z.string().min
function min(this: z.ZodString, minLength: number): StringColumn {
  return modifyColumn(
    this,
    base => orig_min.call(base, minLength),
    options => options,
    modifiers
  )
}

const orig_length = z.string().length
function length(this: z.ZodString, length: number): StringColumn {
  return modifyColumn(
    this,
    base => orig_length.call(base, length),
    options => ({...options, length}),
    modifiers,
  )
}

const modifiers: StringColumnModifiers = {
  max,
  min,
  length,
}

export interface StringColumnModifiers {
  max: typeof max
  min: typeof min
  length: typeof length
}

export type StringColumn = column<z.ZodString, StringColumnModifiers>
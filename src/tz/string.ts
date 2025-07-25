import { z } from 'zod'

import { createColumnType, modifyColumnType } from './column'

export function string(): StringColumnType {
  return createColumnType(z.string(), {
    type: 'varchar'
  }, {
    max,
    min,
    length
  })
}

const orig_max = z.string().max
function max(this: z.ZodString, maxLength: number): StringColumnType {
  return modifyColumnType(
    this,
    base => orig_max.call(base, maxLength),
    options => ({...options, length: maxLength})
  )
}

const orig_min = z.string().min
function min(this: z.ZodString, minLength: number): StringColumnType {
  return modifyColumnType(
    this,
    base => orig_min.call(base, minLength)    
  )
}

const orig_length = z.string().length
function length(this: z.ZodString, length: number): StringColumnType {
  return modifyColumnType(
    this,
    base => orig_length.call(base, length),
    options => ({...options, length})
  )
}

export type StringColumnType = z.ZodString & {
  max: typeof max
  min: typeof min
  length: typeof length
}
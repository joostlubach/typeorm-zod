import { z } from 'zod'

import { createColumnType, modifyColumnType } from './column'

export function number(): FloatColumnType {
  return createColumnType(z.number(), {
    type: 'number'
  }, {
    precision,
    scale,
  })
}

export function int(): IntColumnType {
  return createColumnType(z.int(), {
    type: 'int'
  }, {})
}

export function bigint(): IntColumnType {
  return createColumnType(z.int(), {
    type: 'bigint'
  }, {})
}

export function float(initialPrecision?: number, initialScale?: number): FloatColumnType {
  return createColumnType(z.number(), {
    type: 'float',
    precision: initialPrecision,
    scale: initialScale 
  }, {
    precision,
    scale,

  })
}

export function decimal(initialPrecision?: number, initialScale?: number): FloatColumnType {
  return createColumnType(z.number(), {
    type: 'decimal',
    precision: initialPrecision,
    scale: initialScale
  }, {
    precision,
    scale,

  })
}

function precision(this: z.ZodNumber, precision: number) {
  return modifyColumnType(
    this,
    base => base,
    options => ({ ...options, precision })
  )
} 

function scale(this: z.ZodNumber, scale: number) {
  return modifyColumnType(
    this,
    base => base,
    options => ({ ...options, scale })
  )
}

export type IntColumnType = z.ZodInt
export type FloatColumnType = z.ZodNumber & {
  precision: typeof precision
  scale: typeof scale
}
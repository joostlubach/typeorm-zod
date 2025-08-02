import { z } from 'zod'

import { column, createColumnType, modifyColumn } from '../column'

export function number(): FloatColumn {
  return createColumnType(z.number(), {
    type: 'number'
  }, modifiers)
}

export function int(): IntColumn {
  return createColumnType(z.int(), {
    type: 'int'
  }, {})
}

export function bigint(): IntColumn {
  return createColumnType(z.int(), {
    type: 'bigint'
  }, {})
}

export function float(initialPrecision?: number, initialScale?: number): FloatColumn {
  return createColumnType(z.number(), {
    type: 'float',
    precision: initialPrecision,
    scale: initialScale 
  }, modifiers)
}

export function decimal(initialPrecision?: number, initialScale?: number): FloatColumn {
  return createColumnType(z.number(), {
    type: 'decimal',
    precision: initialPrecision,
    scale: initialScale
  }, modifiers)
}

function precision(this: z.ZodNumber, precision: number) {
  return modifyColumn(
    this,
    base => base,
    options => ({ ...options, precision }),
    modifiers
  )
} 

function scale(this: z.ZodNumber, scale: number) {
  return modifyColumn(
    this,
    base => base,
    options => ({ ...options, scale }),
    modifiers
  )
}

const modifiers: FloatColumnModifiers = {
  precision,
  scale,
}

export interface FloatColumnModifiers {
  precision: typeof precision
  scale: typeof scale
}

export type IntColumn = column<z.ZodInt>
export type FloatColumn = column<z.ZodNumber, FloatColumnModifiers>
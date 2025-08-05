import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import { modifyColumnOptions } from '../registry'

export function int(): IntColumn {
  return buildColumnType(z.int(), {
    options: {
      type: 'int'
    }
  })
}

export function bigint(): IntColumn {
  return buildColumnType(z.int(), {
    options: {
      type: 'bigint'
    }
  })
}

export function float(initialPrecision?: number, initialScale?: number): FloatColumn {
  return buildColumnType(z.number(), {
    options: {
      type: 'float',
      precision: initialPrecision,
      scale: initialScale
    },
    modifiers: modifiers.float
  })
}

export function decimal(initialPrecision?: number, initialScale?: number): FloatColumn {
  return buildColumnType(z.number(), {
    options: {
      type: 'decimal',
      precision: initialPrecision,
      scale: initialScale
    },
    modifiers: modifiers.float
  })
}

function precision<T extends z.ZodNumber>(this: T, precision: number) {
  modifyColumnOptions(this, opts => ({...opts, precision}))
  return this
}

function scale<T extends z.ZodNumber>(this: T, scale: number) {
  modifyColumnOptions(this, opts => ({...opts, scale}))
  return this
}

const modifiers = {
  int: {},
  float: {
    precision,
    scale
  }
} 

export type IntModifiers = typeof modifiers.int
export type FloatModifiers = typeof modifiers.float

export type IntColumn = ColumnType<z.ZodInt, IntModifiers>
export type FloatColumn = ColumnType<z.ZodNumber, FloatModifiers>
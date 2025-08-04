import { z } from 'zod'

import { column, defineColumnType, modifiersOf, modifyColumn } from '../column'

export function int(): IntColumn {
  return defineColumnType(z.int(), {
    type: 'int'
  }, modifiers.int)
}

export function bigint(): IntColumn {
  return defineColumnType(z.int(), {
    type: 'bigint'
  }, modifiers.int)
}

export function float(_: any, initialPrecision?: number, initialScale?: number): FloatColumn {
  return defineColumnType(z.number(), {
    type: 'float',
    precision: initialPrecision,
    scale: initialScale 
  }, modifiers.float)
}

export function decimal(_: any, initialPrecision?: number, initialScale?: number): FloatColumn {
  return defineColumnType(z.number(), {
    type: 'decimal',
    precision: initialPrecision,
    scale: initialScale
  }, modifiers.float)
}

function positive<T extends z.ZodNumber>(this: T) {
  return modifyColumn<T, T, modifiersOf<T>>(this, ['positive', []])
}

function precision<T extends z.ZodNumber>(this: T, precision: number) {
  return modifyColumn<T, T, modifiersOf<T>>(this, options => ({...options, precision}))
}

function scale<T extends z.ZodNumber>(this: T, scale: number) {
  return modifyColumn<T, T, modifiersOf<T>>(this, options => ({...options, scale}))
}

const modifiers = {
  int: {
    positive
  },
  float: {
    positive,
    precision,
    scale
  }
} 

export type IntModifiers = typeof modifiers.int
export type FloatModifiers = typeof modifiers.float

export type IntColumn = column<z.ZodInt, IntModifiers>
export type FloatColumn = column<z.ZodNumber, FloatModifiers>
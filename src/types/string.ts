import { z } from 'zod'

import { column, defineColumnType, modifiersOf, modifyColumn } from '../column'

export function string(type?: 'varchar' | 'text'): StringColumn {
  return defineColumnType(z.string(), {
    type: type ?? 'varchar'
  }, modifiers)
}

function max<T extends z.ZodString>(this: T, maxLength: number) {
  return modifyColumn<T, T, modifiersOf<T>>(this, ['max', [maxLength]], options => ({
    ...options,
    length: maxLength
  }))
}

function min<T extends z.ZodString>(this: T, minLength: number) {
  return modifyColumn<T, T, modifiersOf<T>>(this, ['min', [minLength]])
}

function length<T extends z.ZodString>(this: T, length: number) {
  return modifyColumn<T, T, modifiersOf<T>>(this, ['length', [length]], options => ({
    ...options,
    length: length
  }))
}

const modifiers = {
  max,
  min,
  length,
}

export type StringModifiers = typeof modifiers
export type StringColumn = column<z.ZodString, StringModifiers>
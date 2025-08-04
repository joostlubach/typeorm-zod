import { z } from 'zod'

import { ColumnModifiers } from './column'

/**
 * Wraps a `z.ZodType` into a TypeORM column type.
 */
export type column<T extends z.ZodType<any>, Mod = {}> = T & ColumnModifiers & Mod
export type modifiersOf<T extends z.ZodType<any>> = T extends column<z.ZodType<any>, infer Mod> ? Mod : never

export type ModifierInput<N extends string, A extends any[], T extends z.ZodType<any>, R extends z.ZodType<any>> =
  N extends keyof T ? (
    (base: T, ...args: A) => (upstream: T[N]) => R
  ) : (
    (base: T, ...args: A) => R
  )

export type ModifiersInput<M> = {
  [K in keyof M]: (original: M[K]) => M[K]
}
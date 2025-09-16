import { z } from 'zod'

import { ColumnModifiers } from './column'

export type Shape = Record<string, ColumnType<any, any>>
export type Derivations<S extends Shape> = {
  [K in keyof S]?: Derivation<z.infer<S[K]>, S>
}
export type Derivation<T, S extends Shape> = (obj: z.infer<z.ZodObject<S>>) => T

/**
 * Specialized column type. All modifiers (that is, methods returning a new type) will be wrapped with the same
 * modifiers as the base type.
 */
export type ColumnType<T extends z.ZodType<any>, Mod = {}> = T & ColumnModifiers & Mod & {
  [K in keyof T as T[K] extends (...args: any[]) => z.ZodType<any> ? K : never]:
    T[K] extends (...args: infer A) => z.ZodType<infer R extends z.ZodType<any>>
      ? (...args: A) => ColumnType<R, Mod>
      : T[K]
}

/**
 * Utility type to extract all modifiers (also the base `ColumnModifiers`) from a column type.
 */
export type modifiersOf<T extends z.ZodType<any>> = T extends ColumnType<z.ZodType<any>, infer Mod> ? Mod : never
import { Column, ColumnOptions } from 'typeorm'
import { isFunction } from 'ytil'
import { z } from 'zod'

import { modifierOption } from './modifiers'
import {
  FieldType,
  getMetadata,
  linkRoot,
  Metadata,
  modifyColumnOptions,
  storeMetadata,
} from './registry'

// #region defineColumnType API

export function buildColumnType<T extends z.ZodType<any>, Opts = ColumnOptions, Mod = {}>(type: T, options: BuildColumnTypeOptions<Opts, Mod> = {}): ColumnType<T, Mod> {
  storeMetadata(type, {
    fieldType: FieldType.Column,
    decoratorFactory: Column as unknown as (options: Opts) => PropertyDecorator,
    options: {} as any,
    modifiers: {} as Mod,
    ...options
  })

  extendColumnType<T, Mod>(type, type)
  return type
}

export type BuildColumnTypeOptions<Opts, Mod> = Partial<Metadata<Opts, Mod>>

// #endregion

// #region The magic!

export function extendColumnType<T extends z.ZodType<any>, Mod>(type: T, root: z.ZodType<any>): asserts type is ColumnType<T, Mod> {
  // Make a back link to the root type.
  linkRoot(type, root)

  // Assign modifiers to the type.
  const modifiers = getMetadata(type).modifiers ?? {}
  Object.assign(type, modifiers)

  // Swizzle all functions to ensure they return a wrapped type.
  for (const prop of Object.getOwnPropertyNames(type)) {
    const value = (type as any)[prop]
    if (!isFunction(value)) { continue }

    // Replace the modifier here.
    Object.defineProperty(type, prop, {
      value: extendModifier(type, root, prop, value),
      writable: true,
      enumerable: false
    })
  }
}

function extendModifier<T extends z.ZodType<any>, F extends (...args: any[]) => any>(type: T, root: z.ZodType<any>, prop: string, original: F) {
  const extended = function (...args: any[]) {
    Object.defineProperty(type, prop, {value: original, writable: true, enumerable: false})

    try {
      const retval = original.call(type, ...args)
      if (retval instanceof z.ZodType) {
        return extendColumnType(retval as z.ZodType<any>, root)
      } else {
        return retval
      }
    } finally {
      Object.defineProperty(type, prop, {value: extended, writable: true, enumerable: false})
    }
  }

  return extended
}

export type ModifiersInput<M> = {
  [K in keyof M]: (original: M[K]) => M[K]
}

// #endregion

// #region Common modifiers

const optional = modifierOption('optional', opts => ({...opts, nullable: true}))
const nullable = modifierOption('nullable', opts => ({...opts, nullable: true}))

function unique<T extends z.ZodType<any>>(this: T) {
  modifyColumnOptions(this, opts => ({...opts, unique: true}))
  return this
}

function db_default<T extends z.ZodType<any>>(this: T, def: string) {
  modifyColumnOptions(this, opts => ({...opts, default: def}))
  return this
}

function transformer<T extends z.ZodType<any>, Out>(this: T, transformer: ColumnTransformer<Out, z.output<T>>) {
  modifyColumnOptions(this, opts => ({...opts, transformer}))
  return this
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}

const columnModifiers = {
  optional,
  nullable,
  transformer,
  unique,
  db_default,
}

export type ColumnModifiers = typeof columnModifiers

// #endregion

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
import { Column, ColumnOptions as typeorm_ColumnOptions, Index, IndexOptions } from 'typeorm'
import { isFunction, objectEntries } from 'ytil'
import { z } from 'zod'

import config from './config'
import {
  FieldType,
  getMetadata,
  linkRoot,
  Metadata,
  modifyColumnOptions,
  storeMetadata,
} from './registry'

// #region defineColumnType API

export function buildColumnType<T extends z.ZodType<any>, Mod = {}>(type: T, options?: BuildColumnTypeOptions<ColumnOptions, Mod>): ColumnType<T, Mod>
export function buildColumnType<T extends z.ZodType<any>, Opts, Mod = {}>(type: T, options?: BuildColumnTypeOptions<Opts, Mod>): ColumnType<T, Mod>
export function buildColumnType(type: z.ZodType<any>, options: BuildColumnTypeOptions<any, any> = {}) {
  linkRoot(type, type)
  storeMetadata(type, {
    fieldType:        options.fieldType ?? FieldType.Column,
    decoratorFactory: options.decoratorFactory ?? columnDecoratorFactory,
    options:          {...options.options},
    modifiers:        {...columnModifiers, ...options.modifiers},
  })

  extendColumnType(type, type)
  return type
}

function columnDecoratorFactory(options: ColumnOptions): PropertyDecorator {
  return (target: any, prop: string | symbol) => {
    const field = prop.toString()
    Column(options)(target, prop)

    // Yeah but try to remove this conditional and the types won't work anymore!!!
    if (typeof options.index === 'string') {
      Index(options.index)(target, prop)
    } else if (options.index === true) {
      const name = config.indexNaming(field)
      Index(name)(target, prop)
    }
  }
}

export type BuildColumnTypeOptions<Opts, Mod> = Partial<Metadata<Opts, Mod>>
export interface ColumnOptions extends typeorm_ColumnOptions {
  index?: true | string | IndexOptions
}

// #endregion

// #region The magic!

export function extendColumnType<T extends z.ZodType<any>, Mod>(type: T, root: z.ZodType<any>): asserts type is ColumnType<T, Mod> {
  // Assign modifiers to the type.
  const originalModifiers: Record<string, (...args: any[]) => z.ZodType<any>> = {}
  const modifiers = getMetadata(type).modifiers ?? {}
  for (const [key, value] of objectEntries(modifiers)) {
    originalModifiers[key] = (type as any)[key]
    Object.defineProperty(type, key, {value, writable: true, enumerable: false})
  }

  // Swizzle all functions to ensure they return a wrapped type.
  for (const key of Object.getOwnPropertyNames(type)) {
    const descriptor = Object.getOwnPropertyDescriptor(type, key)
    if (descriptor == null) { continue }
    if (!descriptor.writable) { continue }
    if (!isFunction(descriptor.value)) { continue }

    const original = originalModifiers[key] ?? (type as any)[key]
    const modifier = (modifiers as any)[key]

    Object.defineProperty(type, key, {
      value:      extendModifier(type, root, key as keyof T, modifier, original),
      writable:   true,
      enumerable: false,
    })
  }
}

function extendModifier<T extends z.ZodType<any>, P extends keyof T, F extends(...args: any[]) => any>(type: T, root: z.ZodType<any>, prop: P, modifier: F | undefined, original: F) {
  const extended = function (...args: any[]) {
    // Create a wrapped version of the original function that will return a wrapped type.
    Object.defineProperty(type, prop, {
      value: function (...args: any[]) {
        const retval = original.call(type, ...args)
        if (retval instanceof z.ZodType && retval !== type) {
          // Make a back link to the root type and extend the type.
          linkRoot(retval, root)
          extendColumnType(retval as z.ZodType<any>, root)
        }
        return retval
      },
      writable:   true,
      enumerable: false,
    })

    try {
      return (modifier ?? (type as any)[prop]).call(type, ...args)
    } finally {
      Object.defineProperty(type, prop, {
        value:      extended, 
        writable:   true, 
        enumerable: false,
      })
    }
  }

  return extended
}

export type ModifiersInput<M> = {
  [K in keyof M]: (original: M[K]) => M[K]
}

// #endregion

// #region Common modifiers

function optional<T extends z.ZodType<any>>(this: T) {
  const modified = this.optional()
  modifyColumnOptions(modified, opts => ({...opts, nullable: true}))
  return modified
}

function nullable<T extends z.ZodType<any>>(this: T) {
  const modified = this.nullable()
  modifyColumnOptions(modified, opts => ({...opts, nullable: true}))
  return modified
}

function unique<T extends z.ZodType<any>>(this: T) {
  modifyColumnOptions(this, opts => ({...opts, unique: true}))
  return this
}

function db_default<T extends z.ZodType<any>>(this: T, def: string) {
  modifyColumnOptions(this, opts => ({...opts, default: def}))
  return this
}

function index<T extends z.ZodType<any>>(this: T, nameOrOptions?: string) {
  if (typeof nameOrOptions === 'string') {
    modifyColumnOptions(this, opts => ({...opts, index: nameOrOptions}))
  } else if (nameOrOptions != null) {
    modifyColumnOptions(this, opts => ({...opts, index: nameOrOptions}))
  } else {
    modifyColumnOptions(this, opts => ({...opts, index: true})) 
  }
  return this
}

function db_transform<T extends z.ZodType<any>, Out>(this: T, transformer: ColumnTransformer<Out, z.output<T>>): z.ZodType<Out> {
  modifyColumnOptions(this, opts => ({
    ...opts,
    transformer: {
      from: raw => raw == null ? null : transformer.from(raw),
      to:   value => value == null ? null : transformer.to(value),
    },
  }))
  return this
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}

const columnModifiers = {
  optional,
  nullable,
  db_transform,
  unique,
  db_default,
  index,
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
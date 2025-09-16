import { isArray } from 'lodash'
import {
  Column,
  ColumnOptions as typeorm_ColumnOptions,
  Index,
  IndexOptions,
  Unique,
} from 'typeorm'
import { isFunction, isPlainObject, objectEntries, wrapArray } from 'ytil'
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
import { getTypeORMTableName } from './util'

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

    const {index, unique, ...rest} = options
    Column(rest)(target, prop)

    // Get TypeORM's metadata to determine the table name.
    const tableName = getTypeORMTableName(target.constructor)

    const indexDecorator = buildIndexDecorator(index, tableName, field)
    indexDecorator?.(target, prop)

    const uniqueDecorator = buildUniqueDecorator(unique, tableName, field)
    uniqueDecorator?.(target)
  }
}

export function buildIndexDecorator(arg: ColumnOptions['index'] | undefined, tableName: string, field: string): PropertyDecorator | undefined {
  if (arg == null) { return undefined }

  const options = isArray(arg) ? arg[1] : isPlainObject(arg) ? arg : {}

  let name = isArray(arg) ? arg[0] : typeof arg === 'string' ? arg : undefined
  name ??= config.indexNaming?.(tableName, field, false)

  if (name == null) {
    return Index(options)
  } else {
    return Index(name, options)
  }
}

export function buildUniqueDecorator(arg: ColumnOptions['unique'] | undefined, tableName: string, field: string): ClassDecorator | undefined {
  if (arg == null) { return undefined }

  const options = isArray(arg) ? arg[1] : isPlainObject(arg) ? arg : {}
  const fields = options.scope != null ? [...wrapArray(options.scope), field] : [field]

  let name = isArray(arg) ? arg[0] : typeof arg === 'string' ? arg : undefined
  name ??= config.indexNaming?.(tableName, field, true)

  console.log('UQ -->', tableName, field, name)

  if (name == null) {
    return Unique(fields)
  } else {
    return Unique(name, fields)
  }
}

export type BuildColumnTypeOptions<Opts, Mod> = Partial<Metadata<Opts, Mod>>
export interface ColumnOptions extends Omit<typeorm_ColumnOptions, 'index' | 'unique'> {
  unique?: true | string | UniqueOptions | [string, UniqueOptions]
  index?: true | string | IndexOptions | [string, IndexOptions]
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

function optional<T extends AnyColumnType>(this: T) {
  const modified = (this as z.ZodType<any>).optional()
  modifyColumnOptions<ColumnOptions>(modified, opts => ({...opts, nullable: true}))
  return modified
}

function nullable<T extends AnyColumnType>(this: T) {
  const modified = (this as z.ZodType<any>).nullable()
  modifyColumnOptions<ColumnOptions>(modified, opts => ({...opts, nullable: true}))
  return modified
}

function index<T extends AnyColumnType>(this: T, nameOrOptions?: string | IndexOptions) {
  if (typeof nameOrOptions === 'string') {
    modifyColumnOptions<ColumnOptions>(this, opts => ({...opts, index: nameOrOptions}))
  } else if (nameOrOptions != null) {
    modifyColumnOptions<ColumnOptions>(this, opts => ({...opts, index: nameOrOptions}))
  } else {
    modifyColumnOptions<ColumnOptions>(this, opts => ({...opts, index: true})) 
  }
  return this
}

function unique<T extends AnyColumnType>(this: T, nameOrOptions?: string | UniqueOptions) {
  if (typeof nameOrOptions === 'string') {
    modifyColumnOptions<ColumnOptions>(this, opts => ({...opts, unique: nameOrOptions}))
  } else if (nameOrOptions != null) {
    modifyColumnOptions<ColumnOptions>(this, opts => ({...opts, unique: nameOrOptions}))
  } else {
    modifyColumnOptions<ColumnOptions>(this, opts => ({...opts, unique: true})) 
  }
  return this
}

function db_default<T extends AnyColumnType>(this: T, def: string) {
  modifyColumnOptions<ColumnOptions>(this, opts => ({...opts, default: def}))
  return this
}

function db_transform<T extends AnyColumnType, Raw>(this: T, transformer: ColumnTransformer<z.output<T>, Raw>): T {
  modifyColumnOptions<ColumnOptions>(this, opts => ({
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
  index,
  unique,
  db_transform,
  db_default,
}

export type ColumnModifiers = typeof columnModifiers

// #endregion

export interface UniqueOptions {
  scope?: string | string[]
}

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

type AnyColumnType = ColumnType<any, {}>

/**
 * Utility type to extract all modifiers (also the base `ColumnModifiers`) from a column type.
 */
export type modifiersOf<T extends AnyColumnType> = T extends ColumnType<any, infer Mod> ? Mod : never
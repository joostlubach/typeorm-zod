import { Column, ColumnOptions } from 'typeorm'
import { isFunction, Override } from 'ytil'
import { z } from 'zod'

import { symbols } from './symbols'

export function createColumnType<T extends z.ZodType<any>>(
  base: T,
  columnOptions: ColumnOptions
): column<T>

export function createColumnType<T extends z.ZodType<any>, Mod>(
  base: T,
  columnOptions: ColumnOptions,
  modifiers: Mod
): column<T, Mod>

export function createColumnType<T extends z.ZodType<any>>(
  base: T,
  decoratorFactory: (state: any) => PropertyDecorator,
  columnOptions: ColumnOptions
): column<T>

export function createColumnType<T extends z.ZodType<any>, Mod>(
  base: T,
  decoratorFactory: (state: any) => PropertyDecorator,
  columnOptions: ColumnOptions,
  modifiers: Mod
): column<T, Mod>

export function createColumnType(...args: any[]): column<z.ZodType> {
  const base = args.shift() as z.ZodType
  const decoratorFactory = isFunction(args[0]) ? (args.shift() as (state: any) => PropertyDecorator) : columnDecorator
  const columnOptions = args.shift() as ColumnOptions
  const modifiers = (args.shift() ?? {}) as Record<string, ColumnModifier<z.ZodType, any>>

  const type = base.meta({
    [symbols.decoratorFactory]: decoratorFactory,
    [symbols.decoratorFactoryState]: {
      [symbols.decoratorFactoryColumnOptions]: columnOptions
    }
  })

  Object.assign(type, modifiers)
  return wrapColumn(type)
}

export function modifyColumn<T extends z.ZodType<any>, U extends z.ZodType<any>, Mod = {}>(
  base: T,
  modifier?: (type: T) => U,
  appendOptions?: (upstream: ColumnOptions) => ColumnOptions,
  modifiers: Mod = {} as Mod
): column<U, Mod> {
  const upstream = base.meta() ?? {}
  const upstreamState: Record<string, any> = upstream[symbols.decoratorFactoryState] ?? {}

  let type: z.ZodType = base
  if (modifier != null) {
    type = modifier(type as T)
  }
  if (appendOptions != null) {
    type = type.meta({
      ...upstream,
      [symbols.decoratorFactoryState]: {
        ...upstreamState,
        [symbols.decoratorFactoryColumnOptions]: {
          ...upstreamState[symbols.decoratorFactoryColumnOptions],
          ...appendOptions(upstream[symbols.decoratorFactoryColumnOptions] ?? {})
        }
      }
    })
  }

  const wrapped = wrapColumn(type as U)
  Object.assign(wrapped, modifiers)
  return wrapped as column<U, Mod>
}

export function wrapColumn<T extends z.ZodType<any>>(type: T): column<T> {
  Object.assign(type, {
    transformer,
    optional: optional.bind(type as unknown as column<T>, type.optional),
    nullable: nullable.bind(type as unknown as column<T>, type.nullable),
    unique: unique.bind(type as unknown as column<T>),
    db_default: db_default.bind(type as unknown as column<T>),
  })

  return type as unknown as column<T>
}

function transformer<T extends z.ZodType<any>, Out>(this: T, transformer: ColumnTransformer<Out, z.output<T>>): column<z.ZodType<Out>> {
  return modifyColumn(
    this,
    base => base,
    options => ({...options, transformer})
  )
}

export function optional<T extends z.ZodType<any>>(this: column<T>, orig_optional: any): column<z.ZodType<z.output<T> | undefined>> {
  return modifyColumn(
    this as unknown as T,
    base => orig_optional.call(base) as z.ZodType<z.output<T> | undefined>,
    options => ({...options, nullable: true})
  )
}

export function nullable<T extends z.ZodType<any>>(this: column<T>, orig_nullable: any): column<z.ZodType<z.output<T> | null>> {
  return modifyColumn(
    this as unknown as T,
    base => orig_nullable.call(base) as z.ZodType<z.output<T> | null>,
    options => ({...options, nullable: true})
  )
}

export function unique<T extends z.ZodType<any>>(this: column<T>): column<T> {
  return modifyColumn(
    this as unknown as T,
    base => base,
    options => ({...options, unique: true})
  )
}

export function db_default<T extends z.ZodType<any>>(this: column<T>, def: string): column<z.ZodType<T>> {
  return modifyColumn(
    this as unknown as T,
    base => base,
    options => ({...options, default: def})
  )
}

export interface ColumnModifiers {
  transformer: typeof transformer
  unique: typeof unique
  db_default: typeof db_default
}

function columnDecorator(state: any) {
  const columnOptions = (state[symbols.decoratorFactoryColumnOptions] ?? {}) as ColumnOptions
  return Column(columnOptions)
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}

export type ColumnModifier<T extends z.ZodType, A extends any[]> = (this: T, ...args: A) => column<z.ZodType<any>>
export type column<Base extends z.ZodType<any>, Mod = {}> = Override<Base, ColumnModifiers & Mod>

import { Column, ColumnOptions } from 'typeorm'
import { isFunction } from 'ytil'
import { z } from 'zod'

import { symbols } from './symbols'

export function createColumnType<T extends z.ZodType<any>>(
  base: T,
  columnOptions: ColumnOptions
): T & ColumnTypeModifiers

export function createColumnType<T extends z.ZodType<any>, Mod extends Record<string, ColumnTypeModifier<T, any>>>(
  base: T,
  columnOptions: ColumnOptions,
  modifiers: Mod
): T & Mod & ColumnTypeModifiers 

export function createColumnType<T extends z.ZodType<any>>(
  base: T,
  decoratorFactory: (state: any) => PropertyDecorator,
  columnOptions: ColumnOptions
): T & ColumnTypeModifiers

export function createColumnType<T extends z.ZodType<any>, Mod extends Record<string, ColumnTypeModifier<T, any>>>(
  base: T,
  decoratorFactory: (state: any) => PropertyDecorator,
  columnOptions: ColumnOptions,
  modifiers: Mod
): T & Mod & ColumnTypeModifiers 

export function createColumnType(...args: any[]): z.ZodType & ColumnTypeModifiers {
  const base = args.shift() as z.ZodType
  const decoratorFactory = isFunction(args[0]) ? (args.shift() as (state: any) => PropertyDecorator) : columnDecorator
  const columnOptions = args.shift() as ColumnOptions
  const modifiers = (args.shift() ?? {}) as Record<string, ColumnTypeModifier<z.ZodType, any>>

  const type = base.meta({
    [symbols.decoratorFactory]: decoratorFactory,
    [symbols.decoratorFactoryState]: {
      [symbols.decoratorFactoryColumnOptions]: columnOptions
    }
  })

  Object.assign(type, modifiers)
  return wrapColumnType(type)
}

export function modifyColumnType<T extends z.ZodType<any>, U extends z.ZodType<any>>(
  base: T,
  modifier?: (type: T) => U,
  appendOptions?: (upstream: ColumnOptions) => ColumnOptions
): U & ColumnTypeModifiers {
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

  return wrapColumnType(type as U)
}

export function wrapColumnType<T extends z.ZodType<any>>(type: T): T & ColumnTypeModifiers {
  Object.assign(type, {
    transformer,
    optional: optional.bind(type, type.optional),
    nullable: nullable.bind(type, type.nullable),
    unique: unique.bind(type)
  })

  return type as T & ColumnTypeModifiers
}

function transformer<T extends z.ZodType<any>, Out>(this: T, transformer: ColumnTransformer<Out, z.output<T>>): z.ZodType<Out> {
  return modifyColumnType(
    this,
    base => base,
    options => ({...options, transformer})
  )
}

export function optional<T extends z.ZodType<any>>(this: T, orig_optional: any): z.ZodType<z.output<T> | undefined> {
  return modifyColumnType(
    this,
    base => orig_optional.call(base),
    options => ({...options, nullable: true})
  )
}

export function nullable<T extends z.ZodType<any>>(this: T, orig_nullable: any): z.ZodType<z.output<T> | null> {
  return modifyColumnType(
    this,
    base => orig_nullable.call(base),
    options => ({...options, nullable: true})
  )
}

export function unique<T extends z.ZodType<any>>(this: T): z.ZodType<z.output<T>> {
  return modifyColumnType(
    this,
    base => base,
    options => ({...options, unique: true})
  )
}

export interface ColumnTypeModifiers {
  transformer: typeof transformer
  unique: typeof unique
}

function columnDecorator(state: any) {
  const columnOptions = (state[symbols.decoratorFactoryColumnOptions] ?? {}) as ColumnOptions
  return Column(columnOptions)
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}

export type ColumnTypeModifier<T extends z.ZodType, A extends any[]> = (this: T, ...args: A) => z.ZodType<any>
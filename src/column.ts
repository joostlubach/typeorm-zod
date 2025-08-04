import { Column, ColumnOptions } from 'typeorm'
import { isFunction } from 'ytil'
import { z } from 'zod'

import { appendColumnOption, modifierOption, wrapColumnType } from './modifiers'
import { symbols } from './symbols'
import { column, ModifiersInput } from './typings'

export function defineColumnType<T extends z.ZodType<any>>(
  base: T,
  columnOptions: ColumnOptions
): column<T>

export function defineColumnType<T extends z.ZodType<any>, Mod>(
  base: T,
  columnOptions: ColumnOptions,
  modifiers: ModifiersInput<Mod>
): column<T, Mod>

export function defineColumnType<T extends z.ZodType<any>>(
  base: T,
  decoratorFactory: (state: any) => PropertyDecorator,
  columnOptions: ColumnOptions
): column<T>

export function defineColumnType<T extends z.ZodType<any>, Mod>(
  base: T,
  decoratorFactory: (state: any) => PropertyDecorator,
  columnOptions: ColumnOptions,
  modifiers: ModifiersInput<Mod>
): column<T, Mod>

export function defineColumnType(...args: any[]): column<z.ZodType, any> {
  const base = args.shift() as z.ZodType
  const decoratorFactory = isFunction(args[0]) ? (args.shift() as (state: any) => PropertyDecorator) : columnDecorator
  const columnOptions = args.shift() as ColumnOptions
  const modifiers = (args.shift() ?? {}) as ModifiersInput<any>

  const type = base.meta({
    [symbols.decoratorFactory]: decoratorFactory,
    [symbols.decoratorFactoryState]: {
      [symbols.decoratorFactoryColumnOptions]: columnOptions
    },
    [symbols.modifiers]: modifiers
  })
  return wrapColumnType(type, type)
}

function columnDecorator(state: any) {
  const columnOptions = (state[symbols.decoratorFactoryColumnOptions] ?? {}) as ColumnOptions
  return Column(columnOptions)
}

// #region Modifiers

modifierOption('optional', opts => ({...opts, nullable: true}))
modifierOption('nullable', opts => ({...opts, nullable: true}))

function unique<T extends z.ZodType<any>>(this: T) {
  appendColumnOption(this, opts => ({...opts, unique: true}))
  return this
}

function db_default<T extends z.ZodType<any>>(this: T, def: string) {
  appendColumnOption(this, opts => ({...opts, default: def}))
  return this
}

function transformer<T extends z.ZodType<any>, Out>(this: T, transformer: ColumnTransformer<Out, z.output<T>>) {
  appendColumnOption(this, opts => ({...opts, transformer}))
  return this
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}

const columnModifiers = {
  transformer,
  unique,
  db_default,
}

export type ColumnModifiers = typeof columnModifiers

// #endregion
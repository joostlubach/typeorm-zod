import { ColumnOptions } from 'typeorm'
import { z } from 'zod'

import { symbols } from '../symbols'
import { findMeta } from '../util'

export function wrapColumnType<T extends z.ZodType<any>>(type: T): T & ColumnTypeModifiers {
  Object.assign(type, {
    transformer,
    optional: optional.bind(type, type.optional),
    nullable: nullable.bind(type, type.nullable),
  })

  return type as T & ColumnTypeModifiers
}

export function transformer<T extends z.ZodType<any>, Out>(this: T, transformer: ColumnTransformer<Out, z.output<T>>): z.ZodType<Out> {
  const upstream = findMeta<ColumnOptions>(this, symbols.decoratorFactoryArgs) ?? {}
  return this.meta({
    [symbols.decoratorFactoryArgs]: {
      ...upstream,
      transformer
    }
  })
}

export function optional<T extends z.ZodType<any>>(this: T, orig_optional: any): z.ZodType<z.output<T> | undefined> {
  const upstream = findMeta<any>(this, symbols.decoratorFactoryArgs) ?? {}
  const type = orig_optional.call(this).meta({
    [symbols.decoratorFactoryArgs]: {
      ...upstream,
      [symbols.decoratorFactoryColumnOptionsArg]: {
        ...upstream[symbols.decoratorFactoryColumnOptionsArg],
        nullable: true,
      }
    }
  })

  return wrapColumnType(type)
}

export function nullable<T extends z.ZodType<any>>(this: T, orig_nullable: any): z.ZodType<z.output<T> | null> {
  const upstream = findMeta<any>(this, symbols.decoratorFactoryArgs) ?? {}
  const type = orig_nullable.call(this).meta({
    [symbols.decoratorFactoryArgs]: {
      ...upstream,
      [symbols.decoratorFactoryColumnOptionsArg]: {
        ...upstream[symbols.decoratorFactoryColumnOptionsArg],
        nullable: true,
      }
    }
  })

  return wrapColumnType(type)
}

export interface ColumnTypeModifiers {
  transformer: typeof transformer
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}
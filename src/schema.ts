import { IndexOptions, TableUniqueOptions } from 'typeorm'
import { EmptyObject } from 'ytil'
import { z } from 'zod'

import { symbols } from './symbols'
import { Derivations, Shape } from './typings'

export function schema<S extends Shape>(shape: S): Schema<S, EmptyObject>
export function schema<S extends Shape, D extends Derivations<S>>(shape: S, derivations: D): Schema<S, D>
export function schema(shape: Shape, derivations: Derivations<any> = {}) {
  const schema = z.object(shape)
  augmentSchema(schema, shape, derivations)
  return schema
}

function augmentSchema<S extends Shape, D extends Derivations<S>>(input: z.ZodObject, shape: S, derivations: D): asserts input is Schema<S, D> {
  Object.assign(schema, {
    shape,
    derivations,
    indexes: [],
    uniques: [],

    derive,
    index,
    unique
  })
}

function derive<S extends Schema<any, any>>(this: S, derivations: Derivations<S>) {
  return {
    ...this,
    derivations: {
      ...this.derivations,
      ...derivations
    }
  }
}

function index<S extends Shape>(this: Schema<S>, name: string, options: IndexOptions | {synchronize: false} = {}) {
  return {
    ...this,
    indexes: [
      ...this.indexes,
      [name, options]
    ]
  }
}

function unique<S extends Shape>(this: Schema<S>, name: string, columnNames: string[], options: Omit<TableUniqueOptions, 'name' | 'columnNames'> = {}) {
  return {
    ...this,
    uniques: [
      ...this.uniques,
      [name, columnNames, options]
    ]
  }
}

export function mergeSchemas<S1 extends Schema<any, any>, S2 extends Schema<any, any>>(left: S1, right: S2): mergeSchemas<S1, S2> {
  const shape: Shape = {
    ...left.shape,
    ...right.shape,
  }
  const derivations = {
    ...left.derivations,
    ...right.derivations,
  }

  // Build a new schema.
  let next = schema(shape, derivations)

  // Apply all additional checks from both schemas.
  for (const check of [...(left.def.checks ?? []), ...(right.def.checks ?? [])]) {
    next = next.check(check as z.core.$ZodCheck<any>)
  }
  
  return next
}

export interface Schema<S extends Shape, D extends Derivations<S> = {}> extends z.ZodObject<S> {
  readonly shape: S
  readonly derivations: D
  readonly indexes: ReadonlyArray<[string, IndexOptions | {synchronize: false}]>
  readonly uniques: ReadonlyArray<[string, string[], TableUniqueOptions]>

  derive<ExtraDerivations extends Derivations<S>>(derivations: ExtraDerivations): Schema<S, D & ExtraDerivations>
  
  index(name: string, options?: IndexOptions | {synchronize: false}): this
  unique(name: string, columnNames: string[], options?: Omit<TableUniqueOptions, 'name' | 'columnNames'>): this
}

export type EmptySchema = Schema<Record<string, never>, Record<string, never>>

export type shapeOf<S extends Schema<any, any>> = S['shape']
export type derivationsOf<S extends Schema<any, any>> = S['derivations']

export type mergeSchemas<S1 extends Schema<any, any>, S2 extends Schema<any, any>> = Schema<
  shapeOf<S1> & shapeOf<S2>,
  derivationsOf<S1> & derivationsOf<S2>
>

/**
 * Extracts the schema from a given entity instance or class.
 * */
export type schemaOf<T> =
  T extends { [symbols.schema]: infer S extends Schema<any, any> }
    ? S
    : never

/**
 * Retrieves the attributes of any instance of entities created with the given schema. Derived properties
 * are marked as readonly here.
 */
export type attributesOf<T> = schemaOf<T> extends never
  ? T
  : markDerivedAsReadonly<schemaOf<T>>

/**
 * Retrieves the input shape of entities created with the given schema. Derived properties are excluded
 * here.
 */
export type inputOf<T> = schemaOf<T> extends never
  ? T
  : omitDerived<schemaOf<T>>

/**
 * Utility type to mark all derived properties from the schema as readonly.
 */
type markDerivedAsReadonly<S extends Schema<any, any> | never> = S extends never ? never : {
  [K in keyof shapeOf<S> as (K extends keyof derivationsOf<S> ? never : K)]: z.infer<shapeOf<S>[K]>
} & {
  readonly [K in keyof shapeOf<S> as (K extends keyof derivationsOf<S> ? K : never)]: z.infer<shapeOf<S>[K]>
}

/**
 * Utility type to omit all derived properties from the schema.
 */
type omitDerived<S extends Schema<any, any> | never> = S extends never ? never : {
  [K in keyof shapeOf<S> as (K extends keyof derivationsOf<S> ? never : K)]: z.infer<shapeOf<S>[K]>
}

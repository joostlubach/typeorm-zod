import { IndexOptions, TableUniqueOptions } from 'typeorm'
import { EmptyObject, objectEntries } from 'ytil'
import { z } from 'zod'

import { Column } from './column'
import { symbols } from './symbols'
import { ColumnShape, Derivations, output } from './types'

export function schema<S extends ColumnShape>(shape: S): Schema<S, EmptyObject>
export function schema<S extends ColumnShape, D extends Derivations<S>>(shape: S, derivations: D): Schema<S, D>
export function schema(columns: ColumnShape, derivations: Derivations<any> = {}) {
  return new Schema(columns, derivations)
}

export class Schema<S extends ColumnShape, D extends Derivations<S> = {}> {

  constructor(
    public readonly columns: S,
    public readonly derivations: D,
  ) {}

  private readonly zod = z.object({}) as z.ZodObject<output<S>>

  private readonly indexes: Array<[string, IndexOptions | {synchronize: false}]> = []
  private readonly uniques: Array<[string, string[], Omit<TableUniqueOptions, 'name' | 'columnNames'>]> = []

  public derive<S extends ColumnShape, D extends Derivations<S>, DD extends Derivations<S>>(this: Schema<S, D>, derivations: DD): Schema<S, D & DD> {
    Object.assign(this.derivations, derivations)
    return this as Schema<S, D & DD>
  }

  public index(name: string, options: IndexOptions | {synchronize: false} = {}): this {
    this.indexes.push([name, options])
    return this
  }

  public unique(name: string, columnNames: string[], options: Omit<TableUniqueOptions, 'name' | 'columnNames'> = {}): this {
    this.uniques.push([name, columnNames, options])
    return this
  }

  public check(...checks: Array<z.core.CheckFn<z.output<typeof this.zod>> | z.core.$ZodCheck<z.output<typeof this.zod>>>): this {
    this.zod.check(...checks)
    return this
  }

  public refine(check: (arg: z.output<typeof this.zod>) => unknown | Promise<unknown>, params?: string | z.core.$ZodCustomParams) {
    this.zod.refine(check, params)
    return this
  }

  public superRefine(refinement: (arg: z.output<typeof this.zod>, ctx: z.core.$RefinementCtx<z.output<typeof this.zod>>) => void | Promise<void>) {
    this.zod.superRefine(refinement)
    return this
  }

  public resolve(buildType: (column: Column<any>, key: keyof columnsOf<this>) => z.ZodType | null): z.ZodObject {
    const shape: Record<any, z.ZodType> = {}

    for (const [key, column] of objectEntries(this.columns)) {
      const type = buildType(column, key)
      if (type == null) { continue }

      shape[key] = type
    }
    
    // Build a new schema.
    const next = z.object(shape)

    // Apply all additional checks from the original schema.
    for (const check of this.zod.def.checks ?? []) {
      next.check(check as z.core.$ZodCheck<any>)
    }
    return next
  }

  public merge(other: Schema<any, any>) {
    const columns: ColumnShape = {
      ...this.columns,
      ...other.columns,
    }
    const derivations = {
      ...this.derivations,
      ...other.derivations,
    }

    // Build a new schema.
    const next = schema(columns, derivations)

    // Apply all additional checks from both schemas.
    for (const check of [...(this.zod.def.checks ?? []), ...(other.zod.def.checks ?? [])]) {
      next.check(check as z.core.$ZodCheck<any>)
    }
    
    return next
  }

}

export type EmptySchema = Schema<Record<string, never>, Record<string, never>>

export type columnsOf<S extends Schema<any, any>> = S['columns']
export type derivationsOf<S extends Schema<any, any>> = S['derivations']

export type mergeSchemas<S1 extends Schema<any, any>, S2 extends Schema<any, any>> = Schema<
  columnsOf<S1> & columnsOf<S2>,
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
  ? {[K in keyof T]: T[K]}
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
  [K in keyof columnsOf<S> as (K extends keyof derivationsOf<S> ? never : K)]: output<columnsOf<S>[K]>
} & {
  readonly [K in keyof columnsOf<S> as (K extends keyof derivationsOf<S> ? K : never)]: output<columnsOf<S>[K]>
}

/**
 * Utility type to omit all derived properties from the schema.
 */
type omitDerived<S extends Schema<any, any> | never> = S extends never ? never : {
  [K in keyof columnsOf<S> as (K extends keyof derivationsOf<S> ? never : K)]: output<columnsOf<S>[K]>
}

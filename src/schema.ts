import { IndexOptions, TableUniqueOptions } from 'typeorm'
import { EmptyObject, objectEntries } from 'ytil'
import { z } from 'zod'

import { Column, DefaultColumn } from './column'
import { symbols } from './symbols'
import { ColumnShape, Derivations, output } from './types'

export function schema<S extends ColumnShape>(shape: S): Schema<S, EmptyObject>
export function schema<S extends ColumnShape, D extends Derivations<S>>(shape: S, derivations: D): Schema<S, D>
export function schema(columns: ColumnShape, derivations: Derivations<any> = {}) {
  return new Schema(columns, derivations)
}

export class Schema<S extends ColumnShape, D extends Derivations<S> = EmptyObject> {

  constructor(
    public readonly columns: S,
    public readonly derivations: D,
  ) {}

  private _zod = z.object({}) as z.ZodObject<output<S>>
  public get zod() { return this._zod }

  private readonly _indexes: Array<[string, IndexOptions | {synchronize: false}]> = []
  public get indexes() { return this._indexes }

  private readonly _uniques: Array<[string, string[], Omit<TableUniqueOptions, 'name' | 'columnNames'>]> = []
  public get uniques() { return this._uniques }

  public derive<S extends ColumnShape, D extends Derivations<S>, DD extends Derivations<S>>(this: Schema<S, D>, derivations: DD): Schema<S, D & DD> {
    Object.assign(this.derivations, derivations)
    return this as Schema<S, D & DD>
  }

  public index(name: string, options: IndexOptions | {synchronize: false} = {}): this {
    this._indexes.push([name, options])
    return this
  }

  public unique(name: string, columnNames: string[], options: Omit<TableUniqueOptions, 'name' | 'columnNames'> = {}): this {
    this._uniques.push([name, columnNames, options])
    return this
  }

  public check(...checks: Array<z.core.CheckFn<output<this>> | z.core.$ZodCheck<output<this>>>): this {
    // TODO: Fix typing.
    this._zod = this.zod.check(...checks as any[])
    return this
  }

  public refine(check: (arg: output<this>) => unknown | Promise<unknown>, params?: string | z.core.$ZodCustomParams) {
    // TODO: Fix typing.
    this._zod = this.zod.refine(check as any, params)
    return this
  }

  public superRefine(refinement: (arg: output<this>, ctx: z.core.$RefinementCtx<output<this>>) => void | Promise<void>) {
    // TODO: Fix typing.
    this._zod = this.zod.superRefine(refinement as any)
    return this
  }

  public resolve(buildType: (column: Column<z.ZodType<any>, boolean>, key: keyof columnsOf<this>) => z.ZodType | null): z.ZodObject {
    const shape: Record<any, z.ZodType> = {}

    for (const [key, column] of objectEntries(this.columns)) {
      const type = buildType(column, key)
      if (type == null) { continue }

      shape[key] = type
    }
    
    // Build a new schema.
    let next = z.object(shape)

    // Apply all additional checks from the original schema.
    for (const check of this.zod.def.checks ?? []) {
      next = next.check(check as z.core.$ZodCheck<any>)
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

export type AnySchema = Schema<ColumnShape, Derivations<ColumnShape>>
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
 * Retrieves the attributes of any instance of entities created with the given schema.
 * 
 * - Derived columns are marked as readonly here.
 * - Generated columns are marked as readonly here.
 */
export type schemaAttributes<T> = schemaOf<T> extends never ? {
  [K in keyof T]: T[K]
} : {
  [K in keyof schemaOf<T>['columns'] as (
    K extends keyof derivationsOf<schemaOf<T>> ? never : K
  )]: output<schemaOf<T>>[K]
} & {
  readonly [K in keyof schemaOf<T>['columns'] as (
    K extends keyof derivationsOf<schemaOf<T>> ? K : never
  )]: output<schemaOf<T>>[K]
}

/**
 * Retrieves the input shape of entities created with the given schema.
 * 
 * - Derived columns are excluded here.
 * - Generated columns are excluded here.
 * - Columns with defaults are made optional here.
 */
export type schemaInput<T> = schemaOf<T> extends never ? {
  [K in keyof T]: T[K]
} : {
  [K in keyof schemaOf<T>['columns'] as (
    schemaOf<T>['columns'][K] extends DefaultColumn<any> ? never :
    schemaOf<T>['columns'][K] extends Column<any, true> ? never :
    K extends keyof derivationsOf<schemaOf<T>> ? never :
    K
  )]: output<schemaOf<T>>[K]
} & {
  [K in keyof schemaOf<T>['columns'] as (
    schemaOf<T>['columns'][K] extends DefaultColumn<any> ? K :
    never
  )]?: output<schemaOf<T>>[K]
}
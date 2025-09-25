import { pick } from 'lodash'
import {
  Column as typeorm_Column,
  ColumnOptions as typeorm_ColumnOptions,
  ColumnType as typeorm_ColumnType,
  Index,
  IndexOptions,
  ObjectType,
  Unique,
} from 'typeorm'
import { AnyFunction, Constructor, wrapArray } from 'ytil'
import { z } from 'zod'

import config from './config'
import { FieldType } from './types'
import { getTypeORMTableName, invokeClassDecorator, invokePropertyDecorator } from './util'

export class Column<T extends z.ZodType<any>, Generated extends boolean = false> {

  constructor(
    zod: T,
    typeOrOptions?: ColumnType | ColumnOptions,
  ) {
    this._zod = zod
    this.options = typeof typeOrOptions === 'string'
      ? {type: typeOrOptions}
      : (typeOrOptions ?? {})
  }

  public copy(): this {
    const This = this.constructor as Constructor<this>
    return new This(this.zod, {...this.options})
  }

  private _zod: T
  public get zod() { return this._zod }

  public readonly options: ColumnOptions

  public get isReadOnly() {
    if (this.isGenerated) { return true }
    return this.zod instanceof z.ZodReadonly
  }
  
  public get isGenerated(): Generated {
    return (this.fieldType === FieldType.Generated) as Generated
  }
  
  public get fieldType() {
    return FieldType.Column
  }

  protected modify(zod: T) {
    this._zod = zod
  }

  // #region Basic modifiers

  /**
   * Creates an optional version of this column. Note that the semantics here are _different_ from Zod's
   * `optional()`. As databases don't have the concept of `undefined`, optional basically means:
   * `nullable` + `default(null)`.
   */
  public optional(): DefaultColumn<NullableColumn<this>> {
    return this.nullable().default(null)
  }

  /**
   * Allows the value to take `null`. To also default to `null`, is `.optional()`.
   */
  public nullable(): NullableColumn<this> {
    return this.transmute(NullableColumn)
  }

  /**
   * Assigns a default value to this column. Note that this is not a DB-level default, but an application
   * level default. To use an actual DB level default, use `.opts({default: ...})`.
   * @param value 
   * @returns 
   */
  public default(value: z.output<T> | (() => z.util.NoUndefined<z.output<T>>)): DefaultColumn<this> {
    return this.transmute(DefaultColumn, value)
  }

  /**
   * Adds additional options to this column.
   * @param options 
   * @returns 
   */
  public opts(options: Partial<ColumnOptions>): this {
    const copy = this.copy()
    Object.assign(copy.options, options)
    return copy
  }

  public check(...checks: Array<z.core.CheckFn<z.core.output<T>> | z.core.$ZodCheck<z.core.output<T>>>) {
    this.zod.check(...checks)
    return this
  }

  public refine(check: (arg: z.core.output<T>) => unknown | Promise<unknown>, params?: string | z.core.$ZodCustomParams) {
    this.zod.refine(check, params)
    return this
  }

  public superRefine(refinement: (arg: z.core.output<T>, ctx: z.core.$RefinementCtx<z.core.output<T>>) => void | Promise<void>) {
    this.zod.superRefine(refinement)
    return this
  }

  protected transmute<A extends any[], O extends Column<any, any>>(ctor: new (orig: this, ...args: A) => O, ...args: A) {
    const column = new ctor(this, ...args)
    Object.assign(column, pick(this, '_index', '_unique'))
    return column
  }

  // #endregion

  // #region Index & unique

  private _index: [string | undefined, IndexOptions] | null = null
  private _unique: [string | undefined, UniqueOptions] | null = null

  public get uniqueOptions() {
    return this._unique?.[1] ?? null
  }

  public index(options?: IndexOptions): this
  public index(name: string, options?: IndexOptions): this
  public index(...args: any[]): this {
    const name = typeof args[0] === 'string' ? args.shift() : undefined
    const options = args.shift() ?? {} as IndexOptions

    const copy = this.copy()
    copy._index = [name, options]
    return copy
  }

  public unique(options?: UniqueOptions): this
  public unique(name: string, options?: UniqueOptions): this
  public unique(...args: any[]): this {
    const name = typeof args[0] === 'string' ? args.shift() : undefined
    const options = args[0] ?? {} as UniqueOptions

    const copy = this.copy()
    copy._unique = [name, options]
    return copy
  }

  // #endregion

  // #region Additional modifiers

  /**
   * Adds a transformer to this column. Also note here, this does not have the same semantics as Zod's
   * `transform()`. This is a TypeORM-level transformer, which transforms between the database format
   * and the application format. The transformer therefore has a `from` and a `to` function.
   * 
   * For now, we offer no way to apply a (one way) Zod transform, because it sort of doesn't fit the
   * ORM model. It can however be applied to inner types: `tz.string(z.email().transform(...))`.
   * TODO: figure out if we want to support this.
   */
  public transform<Raw>(transformer: ColumnTransformer<z.output<T>, Raw>) {
    const copy = this.copy()
    copy.options.transformer = {
      from: raw => raw == null ? null : transformer.from(raw),
      to:   value => value == null ? null : transformer.to(value),
    }
    return copy
  }

  // #endregion

  // #region Decorators

  public buildFieldDecorator(_field: string, options: ColumnOptions = {}): PropertyDecorator {
    return (target: object, prop: string | symbol) => {
      invokePropertyDecorator(typeorm_Column, target, prop, {
        ...this.options,
        ...options,
      })

      const tableName = getTypeORMTableName(target.constructor)
      const indexDecorator = this.buildIndexDecorator(tableName, prop.toString() )
      indexDecorator?.(target, prop)
    }
  }

  public buildClassDecorator(field: string, options: ColumnOptions = {}): ClassDecorator {
    return (target: ObjectType<object>) => {
      const tableName = getTypeORMTableName(target)
      const uniqueDecorator = this.buildUniqueDecorator(tableName, field)
      uniqueDecorator?.(target)
    }
  }

  public buildIndexDecorator(tableName: string, field: string): PropertyDecorator | null {
    if (this._index == null) { return null }

    const [
      name = config.indexNaming?.(tableName, field, false),
      options,
    ] = this._index

    return (target: object, property: string | symbol) => {
      if (name == null) {
        invokePropertyDecorator(Index, target, property, options)
      } else {
        invokePropertyDecorator(Index, target, property, name, options)
      }
    }
  }

  public buildUniqueDecorator(tableName: string, field: string): ClassDecorator | null {
    if (this._unique == null) { return null }

    const [
      name = config.indexNaming?.(tableName, field, true),
      options,
    ] = this._unique
    const fields = options.scope != null ? [...wrapArray(options.scope), field] : [field]

    return (target: Function) => {
      if (name == null) {
        invokeClassDecorator(Unique, target, fields)
      } else {
        invokeClassDecorator(Unique, target, name, fields)
      }
    }
  }

  // #endregion

}

export class DefaultColumn<C extends Column<z.ZodType<any>, boolean>> extends Column<z.ZodDefault<C['zod']>> {

  constructor(private readonly base: C, value: z.output<C['zod']> | (() => z.util.NoUndefined<z.output<C['zod']>>)) {
    super(base.zod.default(value), base.options)
  }

  public index(options?: IndexOptions): this
  public index(name: string, options?: IndexOptions): this
  public index(...args: any[]): this {
    this.base.index(...args)
    return this
  }

  public unique(options?: UniqueOptions): this
  public unique(name: string, options?: UniqueOptions): this
  public unique(...args: any[]): this {
    this.base.index(...args)
    return this
  }

  public get fieldType() {
    return this.base.fieldType
  }

  public buildFieldDecorator(field: string, options: ColumnOptions = {}): PropertyDecorator {
    return this.base.buildFieldDecorator(field, options)
  }

  public buildClassDecorator(field: string, options: ColumnOptions = {}): ClassDecorator {
    return this.base.buildClassDecorator(field, options)
  }

}

export class NullableColumn<C extends Column<z.ZodType<any>, boolean>> extends Column<z.ZodNullable<C['zod']>> {

  constructor(private readonly base: C) {
    super(base.zod.nullable(), {
      ...base.options,
      nullable: true,
    })
  }

  public index(options?: IndexOptions): this
  public index(name: string, options?: IndexOptions): this
  public index(...args: any[]): this {
    this.base.index(...args)
    return this
  }

  public unique(options?: UniqueOptions): this
  public unique(name: string, options?: UniqueOptions): this
  public unique(...args: any[]): this {
    this.base.index(...args)
    return this
  }

  public get fieldType() {
    return this.base.fieldType
  }

  public buildFieldDecorator(field: string, options: ColumnOptions = {}): PropertyDecorator {
    return this.base.buildFieldDecorator(field, {...options, nullable: true})
  }

  public buildClassDecorator(field: string, options: ColumnOptions = {}): ClassDecorator {
    return this.base.buildClassDecorator(field, {...options, nullable: true})
  }

}

export type ColumnType = Exclude<typeorm_ColumnType, StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor | BufferConstructor | DateConstructor>
export type ColumnOptions = typeorm_ColumnOptions

export function modifier<C extends Column<any, any>, K extends keyof C['zod']>(
  target: () => C['zod'],
  key: K,
): ColumnModifier<C['zod'][K]> {
  return function (this: Column<z.ZodType<any>, boolean>, ...args: any[]) {
    const tgt = target()
    const method = tgt[key] as AnyFunction
    const retval = method.call(tgt, ...args)
    if (retval === this.zod) { return this }
    if (retval instanceof z.ZodType) {
      const ColumnClass = this.constructor as Constructor<Column<z.ZodType<any>, boolean>>
      return new ColumnClass(retval, this.options)
    } else {
      return retval
    }
  }
}

type ColumnModifier<F extends (...args: any[]) => z.ZodType<any>> = (...args: Parameters<F>) => Column<ReturnType<F>>

export interface UniqueOptions {
  scope?: string | string[]
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}

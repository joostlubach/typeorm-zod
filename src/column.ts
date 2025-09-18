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
import { getTypeORMTableName } from './util'

export class Column<T extends z.ZodType<any>> {

  constructor(
    zod: T,
    typeOrOptions?: ColumnType | ColumnOptions,
  ) {
    this._zod = zod
    this.options = typeof typeOrOptions === 'string'
      ? {type: typeOrOptions}
      : (typeOrOptions ?? {})
  }

  private _zod: T
  public get zod() { return this._zod }

  public readonly options: ColumnOptions

  public get isReadOnly() {
    if (this.isGenerated) { return true }
    return this.zod instanceof z.ZodReadonly
  }
  
  public get isGenerated() {
    return this.fieldType === FieldType.Generated
  }
  
  public get fieldType() {
    return FieldType.Column
  }

  protected modify(zod: T) {
    this._zod = zod
  }

  // #region Zod passthroughs
  
  public optional(): OptionalColumn<T> {
    return this.transmute(OptionalColumn)
  }

  public nullable(): NullableColumn<T> {
    return this.transmute(NullableColumn)
  }

  public default(value: z.output<T> | (() => z.util.NoUndefined<z.output<T>>)): DefaultColumn<T, this> {
    return this.transmute(DefaultColumn, value)
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

  private transmute<A extends any[], O extends Column<any>>(ctor: new (orig: this, ...args: A) => O, ...args: A) {
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

    this._index = [name, options]
    return this
  }

  public unique(options?: UniqueOptions): this
  public unique(name: string, options?: UniqueOptions): this
  public unique(...args: any[]): this {
    const name = typeof args[0] === 'string' ? args.shift() : undefined
    const options = args[0] ?? {} as UniqueOptions

    this._unique = [name, options]
    return this
  }

  // #endregion

  // #region Additional modifiers

  public transform<Raw>(transformer: ColumnTransformer<z.output<T>, Raw>) {
    this.options.transformer = {
      from: raw => raw == null ? null : transformer.from(raw),
      to:   value => value == null ? null : transformer.to(value),
    }
    return this
  }

  // #endregion

  // #region Decorators

  public buildFieldDecorator(_field: string): PropertyDecorator {
    return (target: object, prop: string | symbol) => {
      typeorm_Column(this.options)(target, prop)

      const tableName = getTypeORMTableName(target.constructor)
      const indexDecorator = this.buildIndexDecorator(tableName, prop.toString() )
      indexDecorator?.(target, prop)
    }
  }

  public buildClassDecorator(field: string): ClassDecorator {
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
    if (name == null) {
      return Index(options)
    } else {
      return Index(name, options)
    }
  }

  public buildUniqueDecorator(tableName: string, field: string): ClassDecorator | null {
    if (this._unique == null) { return null }

    const [
      name = config.indexNaming?.(tableName, field, true),
      options,
    ] = this._unique
    const fields = options.scope != null ? [...wrapArray(options.scope), field] : [field]

    if (name == null) {
      return Unique(fields)
    } else {
      return Unique(name, fields)
    }
  }

  // #endregion

}

export class OptionalColumn<T extends z.ZodType<any>> extends Column<z.ZodOptional<T>> {

  constructor(base: Column<T>) {
    super(base.zod.optional(), {
      ...base.options,
      nullable: true,
    })
  }

}

export class NullableColumn<T extends z.ZodType<any>> extends Column<z.ZodNullable<T>> {

  constructor(base: Column<T>) {
    super(base.zod.nullable(), {
      ...base.options,
      nullable: true,
    })
  }

}

export class DefaultColumn<T extends z.ZodType<any>, C extends Column<T>> extends Column<z.ZodDefault<T>> {

  constructor(base: C, value: z.output<T> | (() => z.util.NoUndefined<z.output<T>>)) {
    super(base.zod.default(value), base.options)
  }

}

export type ColumnType = Exclude<typeorm_ColumnType, StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor | BufferConstructor | DateConstructor>
export type ColumnOptions = typeorm_ColumnOptions

export function modifier<C extends Column<any>, K extends keyof C['zod']>(
  target: () => C['zod'],
  key: K,
): ColumnModifier<C['zod'][K]> {
  return function (this: Column<any>, ...args: any[]) {
    const tgt = target()
    const method = tgt[key] as AnyFunction
    const retval = method.call(tgt, ...args)
    if (retval === this.zod) { return this }
    if (retval instanceof z.ZodType) {
      const ColumnClass = this.constructor as Constructor<Column<any>>
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

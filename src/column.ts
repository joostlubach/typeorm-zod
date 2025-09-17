import {
  Column as typeorm_Column,
  ColumnOptions as typeorm_ColumnOptions,
  ColumnType as typeorm_ColumnType,
  Index,
  IndexOptions,
  ObjectType,
  Unique,
} from 'typeorm'
import { AnyFunction, wrapArray } from 'ytil'
import { z } from 'zod'

import { FieldType } from './types'

export class Column<T extends z.ZodType<any>> {

  constructor(
    public readonly zod: T,
    typeOrOptions?: ColumnType | ColumnOptions
  ) {
    this.options = typeof typeOrOptions === 'string'
      ? {type: typeOrOptions}
      : (typeOrOptions ?? {})
  }

  protected readonly options: ColumnOptions

  public get isReadOnly() {
    if (this.isGenerated) { return true }
    return this.zod instanceof z.ZodReadonly
  }
  public get isGenerated() { return false }
  public get fieldType() { return FieldType.Column }

  // #region Zod passthroughs
  
  public optional() {
    const optional = this.zod.optional()
    return new Column(optional, {...this.options, nullable: true})
  }

  public nullable() {
    const nullable = this.zod.nullable()
    return new Column(nullable, {...this.options, nullable: true})
  }

  public default(value: z.output<T>) {
    const withDefault = this.zod.default(value)
    return new DefaultColumn(withDefault, this.options)
  }

  // #endregion

  // #region Index & unique

  private _index: [string | undefined, IndexOptions] | null = null
  private _unique: [string | undefined, UniqueOptions] | null = null

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

  public db_default(expression: string) {
    this.options.default = expression
    return this
  }


  public db_transform<Raw>(transformer: ColumnTransformer<z.output<T>, Raw>) {
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

      const indexDecorator = this.buildIndexDecorator()
      indexDecorator?.(target, prop)
    }
  }

  public buildClassDecorators(field: string): ClassDecorator {
    return (target: ObjectType<object>) => {
      const uniqueDecorator = this.buildUniqueDecorator(field)
      uniqueDecorator?.(target)
    }
  }

  public buildIndexDecorator(): PropertyDecorator | null {
    if (this._index == null) { return null }

    const [name, options] = this._index
    if (name == null) {
      return Index(options)
    } else {
      return Index(name, options)
    }
  }

  public buildUniqueDecorator(field: string): ClassDecorator | null {
    if (this._unique == null) { return null }

    const [name, options] = this._unique
    const fields = options.scope != null ? [...wrapArray(options.scope), field] : [field]

    if (name == null) {
      return Unique(fields)
    } else {
      return Unique(name, fields)
    }
  }

  // #endregion
}

export class OptionalColumn<T extends z.ZodOptional<any>> extends Column<T> {
  constructor(base: T, typeOrOptions?: ColumnType | ColumnOptions) {
    super(base, typeOrOptions)
  }
}

export class NullableColumn<T extends z.ZodNullable<any>> extends Column<T> {
  constructor(base: T, typeOrOptions?: ColumnType | ColumnOptions) {
    super(base, typeOrOptions)
  }
}

export class DefaultColumn<T extends z.ZodDefault<any>> extends Column<T> {
  constructor(base: T, typeOrOptions?: ColumnType | ColumnOptions) {
    super(base, typeOrOptions)
  }
}

export type ColumnType = Exclude<typeorm_ColumnType, StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor | BufferConstructor | DateConstructor>
export type ColumnOptions = typeorm_ColumnOptions

export function deferTo<T extends object, K extends keyof T>(target: () => T, key: K): T[K] {
  return ((...args: any[]) => (target()[key] as AnyFunction)(...args)) as T[K]
}

export interface UniqueOptions {
  scope?: string | string[]
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}

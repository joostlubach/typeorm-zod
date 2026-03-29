import { isArray } from 'lodash'
import {
  Column as typeorm_Column,
  ColumnType,
  JoinColumn,
  JoinColumnOptions,
  ManyToOne,
  ObjectType,
  RelationOptions,
} from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'
import { Column, ColumnOptions, DefaultColumn, NullableColumn } from '../column'
import config, { DefaultForeignKeyType } from '../config'
import { FieldType } from '../types'
import { getTypeORMTableName, invokePropertyDecorator } from '../util'
import { PolymorphicManyToOneColumn } from './polymorphicManyToOne'

// #region manyToOne

function manyToOne_mono<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): ManyToOneColumn<E>
function manyToOne_mono<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): ManyToOneColumn<E>
function manyToOne_mono(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  if (isArray(entity)) {
    return new PolymorphicManyToOneColumn(entity, options)
  } else {
    return new ManyToOneColumn(entity, inverseSide, options)
  }
}

function manyToOne_poly<E extends object[]>(
  entities: string[] | ((type?: any) => {[K in keyof E]: ObjectType<E[K]>}),
  options?: RelationOptions,
): PolymorphicManyToOneColumn<E[number]> {
  return new PolymorphicManyToOneColumn(entities, options)
}

export const manyToOne = manyToOne_mono as typeof manyToOne_mono & {poly: typeof manyToOne_poly}
Object.assign(manyToOne, {poly: manyToOne_poly})

export class ManyToOneColumn<E extends object> extends Column<z.ZodType<E | undefined>> {

  constructor(
      public readonly entity: string | ((type?: any) => ObjectType<any>),
      public readonly inverseSide: string | ((object: any) => any),
      public readonly options: RelationOptions = {},
  ) {
    super(z.object() as z.ZodType<E>, {})
  }

  protected readonly _foreignKeyName?: string
  protected readonly _referencedColumnName?: string
  protected readonly _foreignKeyConstraintName?: string

  public foreignKeyName(field: string) {
    return this._foreignKeyName ?? config.foreignKeys.naming(field)
  }

  public optional(): DefaultColumn<NullableColumn<this>> {
    throw new Error('Relation columns cannot be defaulted. Use nullable() instead.')
  }

  public setNull() {
    this.options.onDelete = 'SET NULL'
    return this
  }

  public cascade() {
    this.options.onDelete = 'CASCADE'
    this.options.onUpdate = 'CASCADE'
    return this
  }
    
  public get fieldType() {
    return FieldType.Relation
  }

  public buildFieldDecorator(field: string, options: ColumnOptions = {}) {
    const column = this

    return function (target: any, property: string | symbol) {
      const {entity, inverseSide} = column

      const tableName = getTypeORMTableName(target.constructor)
      const foreignKey = column._foreignKeyName ?? config.foreignKeys.naming(field)
      const referencedColumnName = column._referencedColumnName
      const foreignKeyConstraintName = column._foreignKeyConstraintName ?? config.foreignKeys.constraintNaming?.(tableName, field)

      invokePropertyDecorator(ManyToOne, target, property, entity, inverseSide, {
        ...column.options,
        nullable: options.nullable,
      })

      invokePropertyDecorator(JoinColumn, target, property, {
        name: foreignKey,
        referencedColumnName,
        foreignKeyConstraintName, 
      })

      const indexDecorator = column.buildIndexDecorator(tableName, field, true)
      indexDecorator?.(target, property)
    }
  }

}

// #endregion

// #region foreignKey

export function foreignKey<T extends z.ZodType<any> = DefaultForeignKeyType>(relationName: string, options: ForeignKeyOptions<T> = {}): ForeignKeyColumn<NoInfer<T>> {
  return new ForeignKeyColumn(relationName, options)
}

export class ForeignKeyColumn<T extends z.ZodType<any> = DefaultForeignKeyType> extends Column<T> {

  constructor(
    public readonly relationName: string,
    options: ForeignKeyOptions<T> = {},
  ) {
    const type = (options.type ?? config.foreignKeys.defaultType) as T
    super(type, {
      ...options,
      type: options.db_type ?? config.foreignKeys.defaultDbType,
    })
  }

  public buildFieldDecorator(_field: string, options: ColumnOptions = {}): PropertyDecorator {
    return (target: object, property: string | symbol) => {
      invokePropertyDecorator(typeorm_Column, target, property, {
        ...config.foreignKeys.defaultDbOptions,
        ...this.options,
        ...options,
      })
    }
  }

}

// #endregion

export interface ForeignKeyOptions<T> extends Omit<JoinColumnOptions, 'type' | 'name'> {
  type?: z.ZodType<T>
  db_type?: ColumnType
}
import {
  Column as typeorm_Column,
  JoinColumn,
  JoinColumnOptions,
  ManyToOne,
  ObjectType,
  RelationOptions,
} from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { Column, ColumnOptions } from '../column'
import config from '../config'
import { FieldType } from '../types'
import { getTypeORMTableName } from '../util'

// #region manyToOne

export function manyToOne<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): ManyToOneColumn<E>
export function manyToOne<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): ManyToOneColumn<E>
export function manyToOne(...args: any[]): ManyToOneColumn<z.ZodType<any | undefined>> {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return new ManyToOneColumn(entity, inverseSide, options)
}

export class ManyToOneColumn<E extends object> extends Column<z.ZodType<E | undefined>> {

  constructor(
      public readonly entity: string | ((type?: any) => ObjectType<any>),
      public readonly inverseSide: string | ((object: any) => any),
      public readonly options: RelationOptions = {},
  ) {
    super(z.object() as z.ZodType<E>, {})
  }

  protected readonly foreignKey?: string
  protected readonly referencedColumnName?: string
  protected readonly foreignKeyConstraintName?: string

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
      const foreignKey = column.foreignKey ?? config.foreignKeyNaming(field)
      const referencedColumnName = column.referencedColumnName
      const foreignKeyConstraintName = column.foreignKeyConstraintName ?? config.foreignKeyConstraintNaming?.(tableName, field)

      ManyToOne(entity, inverseSide, {
        ...column.options,
        nullable: options.nullable,
      })(target, property)

      JoinColumn({
        name: foreignKey,
        referencedColumnName,
        foreignKeyConstraintName, 
      })(target, property)

      const indexDecorator = column.buildIndexDecorator(tableName, field)
      indexDecorator?.(target, property)
    }
  }

}

// #endregion

// #region foreignKey

export function foreignKey(relationName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  return new ForeignKeyColumn(z.int(), relationName, options)
}

export class ForeignKeyColumn<T extends z.ZodType<any>> extends Column<T> {

  constructor(
    base: T,
    public readonly relationName: string,
    public readonly options: Omit<JoinColumnOptions, 'name'> = {},
  ) {
    super(base, options)
  }

  public buildFieldDecorator(_field: string, options: ColumnOptions = {}): PropertyDecorator {
    return typeorm_Column({
      type: config.typemap.int32,
      ...options,
    })
  }

}

export interface ForeignKeyOptions {
  relationName: string
  nullable?: boolean
  options?: Omit<JoinColumnOptions, 'name'>
}

// #endregion
import { isArray } from 'lodash'
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
  options?: RelationOptions
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
    return (target: object, property: string | symbol) => {
      invokePropertyDecorator(typeorm_Column, target, property, {
        type: config.typemap.int32,
        ...options,
      })
    }
  }

}

// #endregion
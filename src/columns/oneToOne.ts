import { JoinColumn, ObjectType, OneToOne, RelationOptions } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'
import { Column, ColumnOptions } from '../column'
import config from '../config'
import { FieldType } from '../types'
import { getTypeORMTableName, invokePropertyDecorator } from '../util'

// #region oneToOne

export function oneToOne<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): OneToOneColumn<E>
export function oneToOne<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): OneToOneColumn<E>
export function oneToOne(...args: any[]): OneToOneColumn<z.ZodType<any | undefined>> {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return new OneToOneColumn(entity, inverseSide, options)
}

export class OneToOneColumn<E extends object> extends Column<z.ZodType<E | undefined>> {

  constructor(
      public readonly entity: string | ((type?: any) => ObjectType<any>),
      public readonly inverseSide: string | ((object: any) => any),
      public readonly options: RelationOptions = {},
  ) {
    super(z.object() as z.ZodType<E>, {})
  }

  protected _foreignKey?: string
  protected _referencedColumnName?: string
  protected _foreignKeyConstraintName?: string

  public useId() {
    this._foreignKey = 'id'
    this._referencedColumnName = 'id'
    return this
  }

  public foreignKey(foreignKey: string) {
    this._foreignKey = foreignKey
    return this
  }

  public referencedColumnName(referencedColumnName: string) {
    this._referencedColumnName = referencedColumnName
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
      const foreignKey = column._foreignKey ?? config.foreignKeyNaming(field)
      const referencedColumnName = column._referencedColumnName
      const foreignKeyConstraintName = column._foreignKeyConstraintName ?? config.foreignKeyConstraintNaming?.(tableName, field)

      invokePropertyDecorator(OneToOne, target, property, entity, inverseSide, {
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
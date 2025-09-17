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

import { Column } from '../column'
import config from '../config'
import { FieldType } from '../types'
import { getTypeORMTableName } from '../util'

// #region manyToOne

export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): ManyToOneColumn<z.ZodType<E | undefined>>
export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): ManyToOneColumn<z.ZodType<E | undefined>>
export function manyToOne(...args: any[]): ManyToOneColumn<z.ZodType<any | undefined>> {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return new ManyToOneColumn(entity, inverseSide, options)
}

export class ManyToOneColumn<E extends object> extends Column<z.ZodType<E | undefined>> {

    constructor(
      protected readonly entity: string | ((type?: any) => ObjectType<any>),
      protected readonly inverseSide: string | ((object: any) => any),
      protected readonly options: RelationOptions = {}
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

    public buildFieldDecorator(field: string) {
      const column = this

      return function (target: any, property: string | symbol) {
        const {
          entity,
          inverseSide,
          options
        } = column


        ManyToOne(entity, inverseSide, options)(target, property)

        const tableName = getTypeORMTableName(target.constructor)
        const foreignKey = column.foreignKey ?? config.foreignKeyNaming(field)
        const referencedColumnName = column.referencedColumnName
        const foreignKeyConstraintName = column.foreignKeyConstraintName ?? config.foreignKeyConstraintNaming?.(tableName, field)
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
    protected readonly options: Omit<JoinColumnOptions, 'name'> = {}
  ) {
    super(base, options)
  }

  private _nullable: boolean = false
  public nullable() {
    this._nullable = true
    return super.nullable()
  }

  public buildFieldDecorator(field: string): PropertyDecorator {
    const column = this

    return (target: any, name: string | symbol) => {
      if (typeof name !== 'string') { return }

      // Place a regular @Column() on this column.
      typeorm_Column('int', {nullable: column._nullable})(target, name)
    }
  }

}

export interface ForeignKeyOptions {
  relationName: string
  nullable?: boolean
  options?: Omit<JoinColumnOptions, 'name'>
}

// #endregion
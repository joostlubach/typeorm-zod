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

  return new ManyToOneColumn(entity, inverseSide, undefined, options)
}

export class ManyToOneColumn<E extends object> extends Column<z.ZodType<E | undefined>> {

    constructor(
      protected readonly entity: string | ((type?: any) => ObjectType<any>),
      protected readonly inverseSide: string | ((object: any) => any),
      protected readonly foreignKey?: string,
      protected readonly options: RelationOptions = {}
    ) {
      super(z.object() as z.ZodType<E>, {})
    }

    public cascade() {
      this.options.onDelete = 'CASCADE'
      this.options.onUpdate = 'CASCADE'
      return this
    }
    
    public get fieldType() {
      return FieldType.Relation
    }

    public buildFieldDecorator(field: string) {
      const {
        entity,
        inverseSide,
        foreignKey: this_foreignKey,
        options
      } = this

      const indexDecorator = this.buildIndexDecorator()

      return function (target: any, property: string | symbol) {
        ManyToOne(entity, inverseSide, options)(target, property)

        const foreignKey = this_foreignKey ?? config.foreignKeyNaming(field)
        JoinColumn({name: foreignKey})(target, property)

        indexDecorator?.(target, property)
      }
    }

    public buildClassDecorator(field: string) {
      const uniqueDecorator = this.buildUniqueDecorator(field)
      return uniqueDecorator
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
    return new NullableForeignKeyColumn(
      this.zod.nullable(),
      this.relationName,
      this.options
    )
  }

  public buildFieldDecorator(field: string): PropertyDecorator {
    const {
      relationName,
      _nullable: this_nullable,
      options
    } = this

      return (target: any, name: string | symbol) => {
      if (typeof name !== 'string') { return }

      // Place a @JoinColumn() on the relationship itself.
      JoinColumn({name, ...options})(target, relationName)

      // Place a regular @Column() on this column.
      typeorm_Column('int', {nullable: this_nullable})(target, name)
    }
  }

}

export class NullableForeignKeyColumn<T extends z.ZodNullable<any>> extends ForeignKeyColumn<T> {
  constructor(base: T, relationName: string, options: Omit<JoinColumnOptions, 'name'> = {}) {
    super(base, relationName, options)
  }
}

export interface ForeignKeyOptions {
  relationName: string
  nullable?: boolean
  options?: Omit<JoinColumnOptions, 'name'>
}

// #endregion
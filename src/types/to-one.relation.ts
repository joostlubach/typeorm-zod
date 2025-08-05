import {
  Column,
  JoinColumn,
  JoinColumnOptions,
  ManyToOne,
  ObjectType,
  RelationOptions,
} from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import { modifyColumnOptions } from '../registry'

// #region manyToOne

export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): ToOneColumn<z.ZodType<E>>
export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): ToOneColumn<z.ZodType<E>>
export function manyToOne(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return buildColumnType(z.object() as z.ZodType<object>, {
    decoratorFactory: manyToOneDecorator,
    options: {
      entity,
      inverseSide,
      options,
    }
  })
}

export interface ManyToOneColumnOptions {
  entity: string | ((type?: any) => ObjectType<any>)
  inverseSide: string | ((object: any) => any)
  options?: RelationOptions
}

export function manyToOneDecorator({entity, inverseSide, options}: ManyToOneColumnOptions) {
  return ManyToOne(entity, inverseSide, options)
}

// #endregion

// #region foreignKey

export function foreignKey(relationName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  return buildColumnType(z.int().positive(), {
    decoratorFactory: foreignKeyDecorator,
    options: {
      relationName,
      options,
    }
  })
}

export function foreignKeyDecorator({relationName, options}: ForeignKeyOptions): PropertyDecorator {
  return (target: any, name: string | symbol) => {
    if (typeof name !== 'string') { return }

    // Place a @JoinColumn() on the relationship itself.
    JoinColumn({name, ...options})(target, relationName)

    // Place a regular @Column() on this column.
    Column('int')(target, name)
  }
}

interface ForeignKeyOptions {
  relationName: string
  options?: Omit<JoinColumnOptions, 'name'>
}

// #endregion

// #region modifiers

function cascade<T extends z.ZodType<any>>(this: T) {
  modifyColumnOptions(this, options => ({
    ...options,
    onDelete: 'CASCADE'
  }))
  return this
}

const modifiers = {
  cascade,
}

// #endregion

export type ToOneModifiers = typeof modifiers
export type ToOneColumn<T extends z.ZodType<any>> = ColumnType<T, ToOneModifiers>
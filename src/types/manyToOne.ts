import {
  Column,
  Index,
  IndexOptions,
  JoinColumn,
  JoinColumnOptions,
  ManyToOne,
  ObjectType,
  RelationOptions,
} from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import config from '../config'
import { FieldType, modifyColumnOptions } from '../registry'

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
export function manyToOne(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return buildColumnType(z.object() as z.ZodType<object>, {
    decoratorFactory: manyToOneDecorator,
    fieldType:        FieldType.Relation,
    options:          {
      entity,
      inverseSide,
      options,
    },
    modifiers,
  })
}

export interface ManyToOneColumnOptions {
  entity: string | ((type?: any) => ObjectType<any>)
  inverseSide: string | ((object: any) => any)
  foreignKey?: string
  nullable?: boolean
  index?: boolean | string | IndexOptions
  options?: RelationOptions
}

export function manyToOneDecorator({entity, inverseSide, foreignKey: explicitForeignKey, nullable, index, options}: ManyToOneColumnOptions) {
  return function (target: any, property: string | symbol) {
    ManyToOne(entity, inverseSide, {...options, nullable})(target, property)

    const foreignKey = explicitForeignKey ?? config.foreignKeyNaming(property.toString())
    JoinColumn({name: foreignKey})(target, property)

    // Yeah but try to remove this conditional and the types won't work anymore!!!
    if (typeof index === 'string') {
      Index(index)(target, property)
    } else if (index === true) {
      const name = config.indexNaming(property.toString())
      Index(name)(target, property)
    }

  }
}

// #endregion

// #region foreignKey

export function foreignKey(relationName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  return buildColumnType(z.int().positive(), {
    decoratorFactory: foreignKeyDecorator,

    options: {
      relationName,
      options,
    },
  })
}

export function foreignKeyDecorator({relationName, nullable, options}: ForeignKeyOptions): PropertyDecorator {
  return (target: any, name: string | symbol) => {
    if (typeof name !== 'string') { return }

    // Place a @JoinColumn() on the relationship itself.
    JoinColumn({name, ...options})(target, relationName)

    // Place a regular @Column() on this column.
    Column('int', {nullable})(target, name)
  }
}

export interface ForeignKeyOptions {
  relationName: string
  nullable?: boolean
  options?: Omit<JoinColumnOptions, 'name'>
}

// #endregion

// #region modifiers

function cascade<T extends z.ZodType<any>>(this: T) {
  modifyColumnOptions<ManyToOneColumnOptions>(this, options => ({
    ...options,
    options: {
      ...options.options,
      onDelete: 'CASCADE',
    },
  }))
  return this
}

function index<T extends z.ZodType<any>>(this: T, nameOrOptions?: string) {
  if (typeof nameOrOptions === 'string') {
    modifyColumnOptions(this, opts => ({...opts, index: nameOrOptions}))
  } else if (nameOrOptions != null) {
    modifyColumnOptions(this, opts => ({...opts, index: nameOrOptions}))
  } else {
    modifyColumnOptions(this, opts => ({...opts, index: true}))
  }
  return this
}

function foreignKeyModifier<T extends z.ZodType<any>>(this: T, foreignKeyField: string) {
  modifyColumnOptions<ManyToOneColumnOptions>(this, options => ({
    ...options,
    foreignKey: foreignKeyField,
  }))
  return this
}

const modifiers = {
  cascade,
  foreignKey: foreignKeyModifier,
}

// #endregion

export type ManyToOneModifiers = typeof modifiers
export type ManyToOneColumn<T extends z.ZodType<any>> = ColumnType<T, ManyToOneModifiers>
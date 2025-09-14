import { snakeCase } from 'lodash'
import pluralize from 'pluralize'
import { JoinColumnOptions, JoinTable, ManyToMany, ObjectType, RelationOptions } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import { FieldType, modifyColumnOptions } from '../registry'

// #region manyToMany

export function manyToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): ManyToManyColumn<z.ZodType<E[]>>
export function manyToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): ManyToManyColumn<z.ZodType<E[]>>
export function manyToMany(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return buildColumnType(z.object() as z.ZodType<object>, {
    decoratorFactory: manyToManyDecorator,
    fieldType:        FieldType.Relation,
    options:          {
      entity,
      inverseSide,
      options,
    },
    modifiers,
  })
}

export interface ManyToManyColumnOptions {
  entity: string | ((type?: any) => ObjectType<any>)
  inverseSide: string | ((object: any) => any)
  joinTableName?: string
  joinColumn?: JoinColumnOptions
  inverseJoinColumn?: JoinColumnOptions
  options?: RelationOptions
}

export function manyToManyDecorator({entity, inverseSide, joinTableName, joinColumn, inverseJoinColumn, options}: ManyToManyColumnOptions) {
  return function (target: any, property: string | symbol) {
    ManyToMany(entity, inverseSide, options)(target, property)

    const thisSidePrefix = snakeCase(target.constructor.name)
    const otherSidePrefix = isFunction(entity) ? snakeCase(entity().name) : snakeCase(entity)
    
    joinTableName ??= [pluralize(thisSidePrefix), pluralize(otherSidePrefix)].sort().join('_')
    joinColumn ??= {name: `${thisSidePrefix}_id`, referencedColumnName: 'id'}
    inverseJoinColumn ??= {name: `${otherSidePrefix}_id`, referencedColumnName: 'id'}
    JoinTable({
      name: joinTableName,
      joinColumn,
      inverseJoinColumn,
    })(target, property)
  }
}

// #endregion

// #region modifiers

function cascade<T extends z.ZodType<any>>(this: T) {
  modifyColumnOptions<ManyToManyColumnOptions>(this, options => ({
    ...options,
    options: {
      ...options.options,
      onDelete: 'CASCADE',
    },
  }))
  return this
}

const modifiers = {
  cascade,
}

// #endregion

export type ManyToManyModifiers = typeof modifiers
export type ManyToManyColumn<T extends z.ZodType<any>> = ColumnType<T, ManyToManyModifiers>
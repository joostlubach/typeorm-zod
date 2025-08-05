import { ObjectType, OneToMany, RelationOptions } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import { FieldType } from '../registry'

export function oneToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): ToManyColumn<E>
export function oneToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): ToManyColumn<E>
export function oneToMany(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return buildColumnType(z.object() as z.ZodType<object>, {
    fieldType: FieldType.Relation,
    decoratorFactory: oneToManyDecorator,
    options: {
      entity,
      inverseSide,
      ...options
    }
  })
}

export interface OneToManyColumnOptions {
  entity: string | ((type?: any) => ObjectType<any>)
  inverseSide: string | ((object: any) => any)
  options?: RelationOptions
}

export function oneToManyDecorator({entity, inverseSide, options}: OneToManyColumnOptions) {
  return OneToMany(entity, inverseSide, options)
}

export type ToManyColumn<E> = ColumnType<z.ZodType<E>>
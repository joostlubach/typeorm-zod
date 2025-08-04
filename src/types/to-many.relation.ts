import { ObjectType, OneToMany } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { FieldType } from '../schemas'
import { symbols } from '../symbols'

export function oneToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: OneToManyOptions
): z.ZodType<E>
export function oneToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: OneToManyOptions
): z.ZodType<E>
export function oneToMany(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: OneToManyOptions = args.shift() ?? {}

  const type = z.array(z.object()).meta({
    [symbols.fieldType]: FieldType.Relation,
    [symbols.decoratorFactory]: oneToManyDecorator,
    [symbols.decoratorFactoryState]: {
      entity, inverseSide, options,
    },
  })

  return type
}

export type OneToManyOptions = Parameters<typeof OneToMany>[2]

export function oneToManyDecorator(args: any) {
  const entity = args.entity as string | ((type?: any) => ObjectType<any>)
  const inverseSide = args.inverseSide as string | ((object: any) => any)
  const options = args.options as OneToManyOptions

  return (target: Function, propertyName: string) => {
    OneToMany(entity, inverseSide, options)(target, propertyName)
  }
}
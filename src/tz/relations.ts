import { Column, JoinColumn, ManyToOne, ObjectType } from 'typeorm'
import { isFunction } from 'ytil'
import { z } from 'zod'

import { symbols } from '../symbols'

export function manyToOne<T>(
  entity: string | ((type?: any) => ObjectType<T>),
  inverseSide?: string | ((object: T) => any),
  options?: ManyToOneOptions
): z.ZodType<T>
export function manyToOne<T>(
  entity: string | ((type?: any) => ObjectType<T>),
  options?: ManyToOneOptions
): z.ZodType<T>
export function manyToOne<T>(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: ManyToOneOptions = args.shift() ?? {}

  return z.object().meta({
    [symbols.decorator]: ManyToOne(entity, inverseSide, options)
  })
}

export function foreignKey(relationshipName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  return z.int().positive().meta({
    [symbols.onAttach]: (target: Function, propertyName: string) => {

      // Place a @JoinColumn() on the relationship itself.
      JoinColumn({
        name: propertyName,
        ...options
      })(target, relationshipName)

      // Place a regular @Column() on this column.
      Column('int')(target, propertyName)
    }
  })

}

type JoinColumnOptions = Parameters<typeof JoinColumn>[0]
type ManyToOneOptions = Parameters<typeof ManyToOne>[2]
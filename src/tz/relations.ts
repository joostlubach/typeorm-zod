import { Column, ColumnOptions, JoinColumn, ManyToOne, ObjectType } from 'typeorm'
import { isFunction } from 'ytil'
import { z } from 'zod'

import { FieldType } from '../field-types'
import { symbols } from '../symbols'
import { findMeta } from '../util'
import { ColumnTypeModifiers, wrapColumnType } from './column'

export function manyToOne<T extends z.ZodType<any>>(
  entity: string | ((type?: any) => ObjectType<z.output<T>>),
  inverseSide?: string | ((object: z.output<T>) => any),
  options?: ManyToOneOptions
): T & ColumnTypeModifiers & ToOneTypeModifiers
export function manyToOne<T extends z.ZodType<any>>(
  entity: string | ((type?: any) => ObjectType<z.output<T>>),
  options?: ManyToOneOptions
): T & ColumnTypeModifiers & ToOneTypeModifiers
export function manyToOne(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: ManyToOneOptions = args.shift() ?? {}

  const type = z.object().meta({
    [symbols.fieldType]: FieldType.Relation,
    [symbols.decoratorFactory]: manyToOneDecorator,
    [symbols.decoratorFactoryArgs]: {
      [symbols.decoratorFactoryColumnOptionsArg]: {},
      entity, inverseSide, options,
    },
  })

  Object.assign(type, {
    cascade
  })

  return wrapColumnType(type as unknown as z.ZodType<any> & ToOneTypeModifiers)
}

export function foreignKey(relationshipName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  const type = z.int().positive().meta({
    [symbols.decoratorFactory]: foreignKeyDecorator,
    [symbols.decoratorFactoryArgs]: {
      [symbols.decoratorFactoryColumnOptionsArg]: {type: 'int'},
      relationshipName,
      options,
    },
  })

  return wrapColumnType(type)
}

function cascade<T extends z.ZodType<T>>(this: T): T {
  const upstream = findMeta<{options?: ManyToOneOptions}>(this, symbols.decoratorFactoryArgs) ?? {}

  const type = this.meta({
    [symbols.decoratorFactoryArgs]: {
      ...upstream,
      options: {
        ...upstream.options,
        onDelete: 'CASCADE',
      }
    }
  })

  return wrapColumnType(type)
}

export function manyToOneDecorator(args: any) {
  const entity = args.entity as string | ((type?: any) => ObjectType<any>)
  const inverseSide = args.inverseSide as string | ((object: any) => any)
  const options = args.options as ManyToOneOptions
  const columnOptions = args[symbols.decoratorFactoryColumnOptionsArg] as ColumnOptions

  return (target: Function, propertyName: string) => {
    ManyToOne(
      entity, 
      inverseSide, 
      {
        ...options,
        nullable: columnOptions.nullable,
      }
    )(target, propertyName)
  }
}

export function foreignKeyDecorator(args: any) {
  const relationshipName = args.relationshipName as string
  const options = args.options as JoinColumnOptions
  const columnOptions = args[symbols.decoratorFactoryColumnOptionsArg] as ColumnOptions

  return (target: Function, propertyName: string) => {
    // Place a @JoinColumn() on the relationship itself.
    JoinColumn({name: propertyName, ...options})(target, relationshipName)

    // Place a regular @Column() on this column.
    Column(columnOptions)(target, propertyName)
  }
}

export interface ToOneTypeModifiers {
  cascade: typeof cascade
}

type JoinColumnOptions = Parameters<typeof JoinColumn>[0][0]
type ManyToOneOptions = Parameters<typeof ManyToOne>[2]
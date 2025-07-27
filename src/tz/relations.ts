import { Column, ColumnOptions, JoinColumn, ManyToOne, ObjectType, OneToMany } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { ColumnTypeModifiers, wrapColumnType } from '../column'
import { FieldType } from '../schemas'
import { symbols } from '../symbols'

export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: ManyToOneOptions
): z.ZodType<E> & ColumnTypeModifiers & ToOneTypeModifiers
export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: ManyToOneOptions
): z.ZodType<E> & ColumnTypeModifiers & ToOneTypeModifiers
export function manyToOne(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: ManyToOneOptions = args.shift() ?? {}

  const type = z.object().meta({
    [symbols.fieldType]: FieldType.Relation,
    [symbols.decoratorFactory]: manyToOneDecorator,
    [symbols.decoratorFactoryState]: {
      [symbols.decoratorFactoryColumnOptions]: {},
      entity, inverseSide, options,
    },
  })

  Object.assign(type, {
    cascade
  })

  return wrapColumnType(type as unknown as z.ZodType<any> & ToOneTypeModifiers)
}

export function oneToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: OneToManyOptions
): z.ZodType<E> & ToManyTypeModifiers
export function oneToMany<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: OneToManyOptions
): z.ZodType<E> & ToManyTypeModifiers
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

  return type as unknown as z.ZodType<any> & ToManyTypeModifiers
}

export interface ToManyTypeModifiers {
  // Add any specific methods for one-to-many relationships here
}

type OneToManyOptions = Parameters<typeof OneToMany>[2]

export function foreignKey(relationshipName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  const type = z.int().positive().meta({
    [symbols.decoratorFactory]: foreignKeyDecorator,
    [symbols.decoratorFactoryState]: {
      [symbols.decoratorFactoryColumnOptions]: {type: 'int'},
      relationshipName,
      options,
    },
  })

  return wrapColumnType(type)
}

function cascade<T extends z.ZodType<T>>(this: T): T {
  const meta = this.meta() ?? {}
  const upstream = (meta[symbols.decoratorFactoryState] ?? {}) as Record<string, any>

  const type = this.meta({
    [symbols.decoratorFactoryState]: {
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
  const columnOptions = args[symbols.decoratorFactoryColumnOptions] as ColumnOptions

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

export function oneToManyDecorator(args: any) {
  const entity = args.entity as string | ((type?: any) => ObjectType<any>)
  const inverseSide = args.inverseSide as string | ((object: any) => any)
  const options = args.options as OneToManyOptions

  return (target: Function, propertyName: string) => {
    OneToMany(entity, inverseSide, options)(target, propertyName)
  }
}

export function foreignKeyDecorator(args: any) {
  const relationshipName = args.relationshipName as string
  const options = args.options as JoinColumnOptions
  const columnOptions = args[symbols.decoratorFactoryColumnOptions] as ColumnOptions

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
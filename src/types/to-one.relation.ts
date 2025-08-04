import { Column, ColumnOptions, JoinColumn, ManyToOne, ObjectType } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { applyModifiers, column, modifiersOf, modifyColumn } from '../column'
import { FieldType } from '../schemas'
import { symbols } from '../symbols'

// #region manyToOne

export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: ManyToOneOptions
): toOneColumn<z.ZodType<E>>
export function manyToOne<E>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: ManyToOneOptions
): toOneColumn<z.ZodType<E>>
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

  return applyModifiers<z.ZodType<any>, ToOneModifiers>(type, modifiers)
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

// #endregion

// #region foreignKey

export function foreignKey(relationshipName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  const type = z.int().positive().meta({
    [symbols.decoratorFactory]: foreignKeyDecorator,
    [symbols.decoratorFactoryState]: {
      [symbols.decoratorFactoryColumnOptions]: {type: 'int'},
      relationshipName,
      options,
    },
  })

  return applyModifiers(type, {})
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

type JoinColumnOptions = Parameters<typeof JoinColumn>[0][0]
type ManyToOneOptions = Parameters<typeof ManyToOne>[2]

// #endregion

// #region modifiers

function cascade<T extends z.ZodType<any>>(this: T) {
  return modifyColumn<T, T, modifiersOf<T>>(
    this,
    options => ({
      ...options,
      onDelete: 'CASCADE'
    })
  )
}

const modifiers = {
  cascade,
}

// #endregion

export type ToOneModifiers = typeof modifiers
export type toOneColumn<T extends z.ZodType<any>> = column<T, ToOneModifiers>
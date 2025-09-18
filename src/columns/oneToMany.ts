import { ObjectType, OneToMany, RelationOptions } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { Column } from '../column'
import { FieldType } from '../types'

export function oneToMany<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): OneToManyColumn<E>
export function oneToMany<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): OneToManyColumn<E>
export function oneToMany(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return new OneToManyColumn(entity, inverseSide, options)
}

export class OneToManyColumn<E extends object> extends Column<z.ZodType<E[]>> {

  constructor(
    public readonly entity: string | ((type?: any) => ObjectType<any>),
    public readonly inverseSide: string | ((object: any) => any),
    public readonly options: RelationOptions = {},
  ) {
    super(z.array(z.object() as z.ZodType<E>), {})
  }

  public get fieldType() {
    return FieldType.Relation
  }

  public buildFieldDecorator() {
    return OneToMany(this.entity, this.inverseSide, this.options)
  }

}
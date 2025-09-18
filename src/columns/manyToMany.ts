import { snakeCase } from 'lodash'
import pluralize from 'pluralize'
import { JoinColumnOptions, JoinTable, ManyToMany, ObjectType, RelationOptions } from 'typeorm'
import { Constructor, isFunction } from 'ytil'
import { z } from 'zod'

import { Column } from '../column'
import { FieldType } from '../types'
import { getTypeORMTableName } from '../util'

export function manyToMany<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  inverseSide?: string | ((object: E) => any),
  options?: RelationOptions
): ManyToManyColumn<E>
export function manyToMany<E extends object>(
  entity: ((type?: any) => Constructor<E>) | string,
  options?: RelationOptions
): ManyToManyColumn<E>
export function manyToMany(...args: any[]) {
  const entity = args.shift()
  const inverseSide = typeof args[0] === 'string' || isFunction(args[0]) ? args.shift() : undefined
  const options: RelationOptions = args.shift() ?? {}

  return new ManyToManyColumn(entity, inverseSide, options)
}

export class ManyToManyColumn<E extends object> extends Column<z.ZodType<E[]>> {

  constructor(
    public readonly entity: string | ((type?: any) => ObjectType<any>),
    public readonly inverseSide: string | ((object: any) => any),
    public readonly options: RelationOptions = {}
  ) {
    super(z.array(z.object() as z.ZodType<E>), {})
  }

  private _joinTableName: string | undefined = undefined
  public joinTableName(name: string) {
    this._joinTableName = name
    return this
  }

  private _joinColumn: JoinColumnOptions | undefined = undefined
  public joinColumn(options: JoinColumnOptions) {
    this._joinColumn = options
    return this
  }

  private _inverseJoinColumn: JoinColumnOptions | undefined = undefined
  public inverseJoinColumn(options: JoinColumnOptions) {
    this._inverseJoinColumn = options
    return this
  }

  public get fieldType() {
    return FieldType.Relation
  }

  public buildFieldDecorator() {
    const {
      entity,
      inverseSide,
      options,
      _joinTableName: this_joinTableName,
      _joinColumn: this_joinColumn,
      _inverseJoinColumn: this_inverseJoinColumn,
    } = this

    return function (target: any, property: string | symbol) {
      const thisSideTableName = getTypeORMTableName(target.constructor)
      const otherSideTableName = isFunction(entity) ? getTypeORMTableName(entity()) : snakeCase(entity)

      const thisSidePrefix = snakeCase(target.constructor.name)
      const otherSidePrefix = isFunction(entity) ? snakeCase(entity().name) : snakeCase(entity)

      const joinTableName = this_joinTableName ?? [
        pluralize(thisSideTableName),
        pluralize(otherSideTableName)
      ].join('_')
      
      const joinColumn = this_joinColumn ?? {
        name: `${thisSidePrefix}_id`,
        referencedColumnName: 'id'
      }

      const inverseJoinColumn = this_inverseJoinColumn ?? {
        name: `${otherSidePrefix}_id`,
        referencedColumnName: 'id'
      }

      ManyToMany(entity, inverseSide, options)(target, property)
      JoinTable({name: joinTableName, joinColumn, inverseJoinColumn})(target, property)
    }
  }

}
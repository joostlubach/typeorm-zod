import {
  Column as typeorm_Column,
  Index,
  JoinColumnOptions,
  ObjectType,
  RelationOptions,
} from 'typeorm'
import { objectEntries } from 'ytil'
import { z } from 'zod'

import { Column, ColumnOptions } from '../column'
import config from '../config'
import { FieldType } from '../types'
import { getTypeORMTableName, invokeClassDecorator, invokePropertyDecorator } from '../util'

// #region manyToOne

export class PolymorphicManyToOneColumn<E extends object> extends Column<z.ZodType<E | undefined>> {

  constructor(
      public readonly entities: string[] | ((type?: any) => ObjectType<any>[]),
      public readonly options: RelationOptions = {},
  ) {
    super(z.object() as z.ZodType<E>, {})
  }

  public get fieldType() {
    return FieldType.Relation
  }

  public buildFieldDecorator(base: string, options: ColumnOptions = {}) {
    const column = this

    return (target: object, prop: string | symbol) => {
      const fields: Record<string, ColumnOptions> = {
        [`${base}_type`]: {type: config.typemap.string},
        [`${base}_id`]: {type: config.typemap.int32},
      }

      for (const [field, options] of objectEntries(fields)) {
        invokePropertyDecorator(typeorm_Column, target, field, {
          ...this.options,
          ...options,
        })
      }
    }
  }

  public buildClassDecorator(base: string, options?: ColumnOptions): ClassDecorator {
    const column = this

    return function (target) {
      if (column._index === false) { return }
      
      const fields = [`${base}_type`, `${base}_id`]      
      const tableName = getTypeORMTableName(target.constructor)

      const [
        name = config.indexNaming?.(tableName, [base], false),
        options,
      ] = column._index ?? []

      invokeClassDecorator(Index, target, name, fields, options)

      const uniqueDecorator = column.buildUniqueDecorator(tableName, fields)
      uniqueDecorator?.(target)
    }
  }


}

// #endregion

// #region discriminator

export function discriminator(relationName: string, options?: Omit<JoinColumnOptions, 'name'>) {
  return new DiscriminatorColumn(z.string(), relationName, options)
}

export class DiscriminatorColumn<T extends z.ZodType<any>> extends Column<T> {

  constructor(
    base: T,
    public readonly relationName: string,
    public readonly options: Omit<JoinColumnOptions, 'name'> = {},
  ) {
    super(base, options)
  }

  public buildFieldDecorator(_field: string, options: ColumnOptions = {}): PropertyDecorator {
    return (target: object, property: string | symbol) => {
      invokePropertyDecorator(typeorm_Column, target, property, {
        type: config.typemap.string,
        ...options,
      })
    }
  }

}

// #endregion
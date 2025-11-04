import { isArray } from 'lodash'
import { AnyEnumType, EnumUtil } from 'ytil'
import { z } from 'zod'

import { Column } from '../column'
import config from '../config'

function _enum<const T extends readonly string[]>(values: T, options?: EnumOptions): Column<z.ZodEnum<ToEnum<T>>>
function _enum<const T extends AnyEnumType>(entries: T, options?: EnumOptions): Column<z.ZodEnum<T>>
function _enum(values: any, options: EnumOptions = {}): Column<z.ZodEnum> {
  const {
    as = 'enum',
    ...params
  } = options

  const resolvedValues: string[] = isArray(values) ? values : EnumUtil.values(values)
  const zod = z.enum(values as any, params)

  if (as === 'enum') {
    return new Column(zod, {
      type: config.typemap.enum,
      enum: values,
    })
  } else {
    return new Column(zod, {
      type:   config.typemap.string,
      length: Math.max(...resolvedValues.map(it => it.length)),
    })
  }
}
export { _enum as enum }

type ToEnum<T extends readonly string[]> = T[number] extends string ? {[K in T[number]]: K} : never

export interface EnumOptions extends z.core.$ZodEnumParams {
  as?: 'enum' | 'string'
}
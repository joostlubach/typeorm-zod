import { AnyEnumType } from 'ytil'
import { z } from 'zod'

import { Column } from '../column'

function _enum<const T extends readonly string[]>(values: T, params?: string | z.core.$ZodEnumParams): Column<z.ZodEnum<ToEnum<T>>>
function _enum<const T extends AnyEnumType>(entries: T, params?: string | z.core.$ZodEnumParams): Column<z.ZodEnum<T>>
function _enum(values: any, params?: string | z.core.$ZodEnumParams): Column<z.ZodEnum> {
  return new Column(z.enum(values as any, params), {
    type: 'enum',
    enum: values,
  })
}
export { _enum as enum }

type ToEnum<T extends readonly string[]> = T[number] extends string ? {[K in T[number]]: K} : never
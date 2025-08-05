import { AnyEnumType } from 'ytil'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'

function _enum<const T extends readonly string[]>(values: T, params?: string | z.core.$ZodEnumParams): ColumnType<z.ZodEnum<ToEnum<T>>>
function _enum<const T extends AnyEnumType>(entries: T, params?: string | z.core.$ZodEnumParams): ColumnType<z.ZodEnum<T>>
function _enum(values: any, params?: string | z.core.$ZodEnumParams): ColumnType<z.ZodEnum> {
  return buildColumnType(z.enum(values as any, params), {
    options: {
      type: 'enum',
      enum: values,
    },
  })
} 
export { _enum as enum }

type ToEnum<T extends readonly string[]> = T[number] extends string ? {[K in T[number]]: K} : never
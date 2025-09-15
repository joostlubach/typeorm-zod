import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'

export function derived<T>(derive: string): DerivedColumnType<z.ZodType<T>>
export function derived<T, E = any>(derive: (entity: E) => T): DerivedColumnType<z.ZodType<T>>
export function derived<T, E = any>(derive: string | ((entity: E) => T)): DerivedColumnType<z.ZodType<T>> {
  const type = z.any() as z.ZodType<T>
  type.meta({derive})
  return buildColumnType(type) as DerivedColumnType<z.ZodType<T>>
}

export type DerivedColumnType<T extends z.ZodType<any>> = ColumnType<T> & {__derived: true}
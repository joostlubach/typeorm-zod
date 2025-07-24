import { Column } from 'typeorm'
import { z } from 'zod'

import { symbols } from '../symbols'

export function createColumnType<T>(type: z.ZodType<T>): ColumnType<T> {
  Object.assign(type, {
    transformer
  })

  return type as ColumnType<T>
}

export function transformer<T extends z.ZodType<any>, Out>(this: T, transformer: ColumnTransformer<Out, z.output<T>>): z.ZodType<Out> {
  return this.meta({
    [symbols.decorator]: Column({
      type: 'json',
      transformer
    })
  }) as unknown as z.ZodType<Out>
} 

export type ColumnType<T> = z.ZodType<T> & {
  transformer: typeof transformer
}

export interface ColumnTransformer<T, Raw> {
  to: (value: T) => Raw
  from: (raw: Raw) => T
}
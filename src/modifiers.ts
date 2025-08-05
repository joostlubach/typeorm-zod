import { ColumnOptions } from 'typeorm'
import { z } from 'zod'



export function modifierOption<N extends string, A extends any[], T extends z.ZodType<any>, R extends z.ZodType<any>>(
  name: N,
  append: (upstream: ColumnOptions) => ColumnOptions,
): T {
  return null as unknown as T
}
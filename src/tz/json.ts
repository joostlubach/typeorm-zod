import { z } from 'zod'

import { createColumnType } from './column'

export function json<T>(base: z.ZodType<T>) {
  return createColumnType(base, {
    type: 'json',
  }, {})
}

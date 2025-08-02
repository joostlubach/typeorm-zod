import { z } from 'zod'

import { column, createColumnType } from '../column'

export function boolean(): column<z.ZodBoolean> {
  return createColumnType(z.boolean(), {
    type: 'boolean'
  })
}
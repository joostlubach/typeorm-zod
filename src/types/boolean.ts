import { z } from 'zod'

import { column, defineColumnType } from '../column'

export function boolean(): column<z.ZodBoolean> {
  return defineColumnType(z.boolean(), {
    type: 'boolean'
  })
}
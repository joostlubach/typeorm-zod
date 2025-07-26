import { z } from 'zod'

import { ColumnTypeModifiers, createColumnType } from '../column'

export function boolean(): z.ZodBoolean & ColumnTypeModifiers {
  return createColumnType(z.boolean(), {
    type: 'boolean'
  })
}
import { Column } from 'typeorm'
import { z } from 'zod'

import { symbols } from '../symbols'
import { createColumnType } from './column'

export function string() {
  const type = z.string().meta({
    [symbols.decorator]: Column('varchar')
  })

  return createColumnType(type)
}

export function int() {
  const type = z.int().meta({
    [symbols.decorator]: Column('int')
  })

  return createColumnType(type)
}

export function json<T>(base: z.ZodType<T>) {
  const type = base.meta({
    [symbols.decorator]: Column('json')
  })

  return createColumnType(type)
}
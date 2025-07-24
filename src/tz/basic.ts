import { Column, ColumnOptions } from 'typeorm'
import { z } from 'zod'

import { symbols } from '../symbols'
import { wrapColumnType } from './column'

export function string() {
  const type = z.string().meta({
    [symbols.decoratorFactory]: columnDecorator,
    [symbols.decoratorFactoryArgs]: {
      [symbols.decoratorFactoryColumnOptionsArg]: {type: 'varchar'}
    },
  })

  return wrapColumnType(type)
}

export function int() {
  const type = z.int().meta({
    [symbols.decoratorFactory]: columnDecorator,
    [symbols.decoratorFactoryArgs]: {
      [symbols.decoratorFactoryColumnOptionsArg]: {type: 'int'}
    },
  })

  return wrapColumnType(type)
}

export function json<T>(base: z.ZodType<T>) {
  const type = base.meta({
    [symbols.decoratorFactory]: columnDecorator,
    [symbols.decoratorFactoryArgs]: {
      [symbols.decoratorFactoryColumnOptionsArg]: {type: 'json'}
    },
  })

  return wrapColumnType(type)
}

function columnDecorator(args: any) {
  const columnOptions = (args[symbols.decoratorFactoryColumnOptionsArg] ?? {}) as ColumnOptions
  return Column(columnOptions)
}
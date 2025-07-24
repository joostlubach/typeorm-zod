import { Entity, EntityOptions } from 'typeorm'
import { objectEntries } from 'ytil'
import { z } from 'zod'

import { symbols } from './symbols'

export function ZodEntity(name: string, schema: z.ZodObject, options?: EntityOptions): ClassDecorator
export function ZodEntity(schema: z.ZodObject, options?: EntityOptions): ClassDecorator
export function ZodEntity(...args: any[]): ClassDecorator {
  const name = typeof args[0] === 'string' ? args.shift() : undefined
  const schema = args.shift() as z.ZodObject
  const options = args.shift() ?? {} as EntityOptions

  return function (target: Function) {
    // Set the schema on the target class.
    Object.assign(target, {[symbols.schema]: schema})

    // Invoke the Entity decorator.
    if (name != null) {
      Entity(name, options)(target)
    } else {
      Entity(options)(target)
    }

    // Run through all types in the schema and run their decorators.
    for (const entry of objectEntries(schema.def.shape)) {
      const propertyName = entry[0]
      const type = entry[1] as z.ZodType

      const meta = (type.meta() ?? {}) as Record<string, any>
      if (symbols.decorator in meta && meta[symbols.decorator] != null) {
        meta[symbols.decorator](target.prototype, propertyName)
      }
      if (symbols.onAttach in meta && meta[symbols.onAttach] != null) {
        meta[symbols.onAttach](target.prototype, propertyName)
      }
    }

  }
}
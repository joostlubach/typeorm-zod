import { objectEntries } from 'ytil'
import { z } from 'zod'

import { symbols } from '../symbols'
import { findMeta } from '../util'

export function Schema(schema: z.ZodObject): ClassDecorator {
  return function (target: Function) {
    // Set the schema on the target class.
    Object.assign(target, {[symbols.schema]: schema})

    // Run through all types in the schema and run their decorators.
    for (const entry of objectEntries(schema.def.shape)) {
      const propertyName = entry[0]
      const type = entry[1] as z.ZodType

      const decorator = createFieldDecorator(type, propertyName)
      decorator?.(target.prototype, propertyName)
    }
  }
}

function createFieldDecorator(type: z.ZodType, _propertyName: string): PropertyDecorator | null {
  const factory =findMeta<(args: any) => PropertyDecorator>(type, symbols.decoratorFactory)
  if (factory == null) { return null }

  const args = findMeta<any>(type, symbols.decoratorFactoryState) ?? {}
  return factory(args)
}
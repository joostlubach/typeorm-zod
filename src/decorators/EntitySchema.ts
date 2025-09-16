import { objectEntries } from 'ytil'
import { z } from 'zod'

import { tryGetMetadata } from '../registry'
import { symbols } from '../symbols'

export function EntitySchema(schema: z.ZodObject): ClassDecorator {
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
  const meta = tryGetMetadata(type)
  if (meta == null) { return null }

  return meta.decoratorFactory(meta.options)
}
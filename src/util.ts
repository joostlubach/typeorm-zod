import { isFunction, objectEntries } from 'ytil'
import { z } from 'zod'

export function modifySchema(schema: z.ZodObject, modifier: (type: z.ZodType, key: string) => z.ZodType | null): z.ZodObject {
  const shape: Record<string, z.ZodType> = {}

  for (const [key, type] of objectEntries(schema.shape)) {
    const modified = modifier(type, key)
    if (modified == null) { continue }

    shape[key] = modified
  }
  
  // Build a new schema.
  let next = z.object(shape)

  // Apply all additional checks from the original schema.
  for (const check of schema.def.checks ?? []) {
    next = next.check(check as z.core.$ZodCheck<any>)
  }
  return next
}

export function findMeta<T>(type: z.ZodType, key: string): T | undefined {
  let current: z.ZodType | undefined = type
  while (current != null) {
    const meta = current.meta()
    if (meta != null && key in meta) {
      return meta[key] as T
    }
    if ('unwrap' in current && isFunction(current.unwrap)) {
      current = current.unwrap()
    } else if (current._zod.parent != null && 'meta' in current._zod.parent && isFunction(current._zod.parent.meta)) {
      current = current._zod.parent as z.ZodType
    } else {
      current = undefined
    }
  }
  return undefined
}
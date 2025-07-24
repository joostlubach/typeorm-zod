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
  let current = type
  while (current != null) {
    const meta = current.meta()
    if (meta != null && key in meta) {
      return meta[key] as T
    }
    current = 'unwrap' in current && isFunction(current.unwrap) ? current.unwrap() : undefined
  }
  return undefined
}

export function collectMeta<T>(type: z.ZodType, key: string): T[] {
  const result: T[] = []
  let current = type

  while (current != null) {
    const meta = current.meta()
    if (meta != null && key in meta) {
      result.push(meta[key] as T)
    }
    current = (current as any)._def?.innerType
  }
  return result.reverse()
}
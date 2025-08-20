import { AnyConstructor } from 'ytil'
import { z } from 'zod'

import { ZodValidationError } from './ZodValidationError'
import { collectSchema, insertSchema, updateSchema } from './schemas'

export function applyDefaults(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)

  for (const [key, type] of Object.entries(schema.shape)) {
    if (type instanceof z.ZodDefault) {
      Object.assign(entity, {[key]: type.def.defaultValue})
    }
  }
}

export async function validateInsert(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)
  const result = await insertSchema(schema).safeParseAsync(entity)
  if (result.success) {
    Object.assign(entity, result.data)
  } else {
    throw new ZodValidationError(entity, result.error.issues)
  }
}

export async function validateUpdate(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)
  const result = await updateSchema(schema).safeParseAsync(entity)
  if (result.success) {
    Object.assign(entity, result.data)
  } else {
    throw new ZodValidationError(entity, result.error.issues)
  }
}
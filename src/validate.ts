import { AnyConstructor } from 'ytil'

import { ZodValidationError } from './ZodValidationError'
import { collectSchema, insertSchema, updateSchema } from './schemas'

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
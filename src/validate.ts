import { AnyConstructor, objectEntries } from 'ytil'
import { z } from 'zod'

import { ZodValidationError } from './ZodValidationError'
import { getMetadata } from './registry'
import { collectSchema, insertSchema, updateSchema } from './schemas'
import { foreignKeyDecorator, ForeignKeyOptions } from './types/manyToOne'

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
  assignForeignKeys(entity, schema)

  const result = await insertSchema(schema).safeParseAsync(entity)
  if (result.success) {
    Object.assign(entity, result.data)
  } else {
    throw new ZodValidationError(entity, result.error.issues)
  }
}

export async function validateUpdate(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)
  assignForeignKeys(entity, schema)

  const result = await updateSchema(schema).safeParseAsync(entity)
  if (result.success) {
    Object.assign(entity, result.data)
  } else {
    throw new ZodValidationError(entity, result.error.issues)
  }
}

function assignForeignKeys(entity: object, schema: z.ZodObject) {
  // Find any foreign key columns, check if there is an associated relationship value and take its ID.
  for (const [key, type] of objectEntries(schema.shape)) {
    const meta = getMetadata(type)
    if (meta.decoratorFactory !== foreignKeyDecorator) { continue }
    if ((entity as any)[key] != null) { continue }

    const options = meta.options as ForeignKeyOptions
    const relation = (entity as any)[options.relationName]
    if (relation != null && 'id' in relation) {
      Object.assign(entity, {[key]: relation.id})
    }
  }
}
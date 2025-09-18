import { AnyConstructor, objectEntries } from 'ytil'
import { z } from 'zod'

import { ZodValidationError } from './ZodValidationError'
import { ForeignKeyColumn } from './columns'
import { AnySchema, Schema } from './schema'
import { collectSchema, insertSchema, updateSchema } from './schemas'

export async function validateInsert(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)
  applyDerivations(entity, schema)
  assignForeignKeys(entity, schema)

  const result = await insertSchema(schema).safeParseAsync(entity, {
    reportInput: true,
  })
  if (result.success) {
    Object.assign(entity, result.data)
  } else {
    throw new ZodValidationError(entity, result.error.issues)
  }
}

export async function validateUpdate(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)
  applyDerivations(entity, schema)
  assignForeignKeys(entity, schema)

  const result = await updateSchema(schema).safeParseAsync(entity, {
    reportInput: true,
  })
  if (result.success) {
    Object.assign(entity, result.data)
  } else {
    throw new ZodValidationError(entity, result.error.issues)
  }
}

async function validateUniqueness(entity: object, schema: AnySchema) {
  for (const [field, column] of objectEntries(schema.columns)) {
    const options = column.uniqueOptions
    if (options == null) { continue }

    const {scope} = options
  }
}

export function applyDefaults(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)

  for (const [key, column] of Object.entries(schema.columns)) {
    if (column.zod instanceof z.ZodDefault) {
      Object.assign(entity, {[key]: column.zod.def.defaultValue})
    }
  }
}

function applyDerivations(entity: object, schema: Schema<any, any>) {
  for (const [key, derivation] of objectEntries(schema.derivations)) {
    if (derivation != null) {
      Object.assign(entity, {
        [key]: derivation(entity as any)
      })
    }
  }
}

function assignForeignKeys(entity: object, schema: Schema<any, any>) {
  // Find any foreign key columns, check if there is an associated relationship value and take its ID.
  for (const [key, column] of objectEntries(schema.columns)) {
    if (!(column instanceof ForeignKeyColumn)) { continue }

    const relation = (entity as any)[column.relationName]
    if (relation != null && 'id' in relation) {
      Object.assign(entity, {[key]: relation.id})
    }
  }
}
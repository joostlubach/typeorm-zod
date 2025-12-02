import { AnyConstructor, objectEntries, objectKeys } from 'ytil'
import { z } from 'zod'

import { ZodValidationError } from './ZodValidationError'
import { ForeignKeyColumn } from './columns'
import { Schema } from './schema'
import { collectSchema, insertSchema, updateSchema } from './schemas'

export async function validateInsert(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)
  assignForeignKeys(entity, schema)

  const validatePass = async () => {
    const result = await insertSchema(schema).safeParseAsync(entity, {
      reportInput: true,
    })
    if (result.success) {
      Object.assign(entity, result.data)
    } else {
      throw new ZodValidationError(entity, result.error.issues)
    }
  }

  await validatePass()
  if (objectKeys(schema.derivations).length > 0) {
    applyDerivations(entity, schema)
    await validatePass()
  }
}

export async function validateUpdate(entity: object) {
  const schema = collectSchema(entity.constructor as AnyConstructor)
  assignForeignKeys(entity, schema)

  const validatePass = async () => {
    const result = await updateSchema(schema).safeParseAsync(entity, {
      reportInput: true,
    })
    if (result.success) {
      Object.assign(entity, result.data)
    } else {
      throw new ZodValidationError(entity, result.error.issues)
    }
  }
  
  await validatePass()
  if (objectKeys(schema.derivations).length > 0) {
    applyDerivations(entity, schema)
    await validatePass()
  }
}

export function applyDefaults(entity: object, overwrite: boolean = false) {
  const schema = collectSchema(entity.constructor as AnyConstructor)

  for (const [key, column] of Object.entries(schema.columns)) {
    if (!(column.zod instanceof z.ZodDefault)) { continue }
    if (!overwrite && (entity as any)[key] != null) { continue }
      
    Object.assign(entity, {[key]: column.zod.def.defaultValue})
  }
}

function applyDerivations(entity: object, schema: Schema<any, any>) {
  for (const [key, derivation] of objectEntries(schema.derivations)) {
    if (derivation != null) {
      Object.assign(entity, {
        [key]: derivation(entity as any),
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
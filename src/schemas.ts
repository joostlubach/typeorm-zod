import { AnyConstructor, superConstructor } from 'ytil'
import { z } from 'zod'

import { Schema, schema } from './schema'
import { symbols } from './symbols'
import { ColumnShape, Derivations, FieldType } from './types'

/**
 * Builds a schema for inserting an entity from an entity schema.
 * 
 * - Generated fields are allowed but made optional.
 * - Relations are omitted.
 */
export function insertSchema(schema: Schema<any, any>): z.ZodObject {
  return schema.resolve((column, key) => {
    if (column.isReadOnly) { return null }
    if (key in schema.derivations) { return null }

    switch (column.fieldType) {
    case FieldType.Relation: return null
    case FieldType.Generated: return column.zod.optional()
    case FieldType.Column: return column.zod
    }
  })
}

/**
 * Builds a schema for updating an entity from an entity schema.
 * 
 * - Generated fields are omitted.
 * - Relations are omitted.
 * - Contrary to what might make sense, regular columns are not made optional. This is because
 *   the full entity is validated, not only the updates.
 */
export function updateSchema(schema: Schema<any, any>): z.ZodObject {
  return schema.resolve((column, key) => {
    if (column.isReadOnly) { return null }
    if (key in schema.derivations) { return null }
    
    switch (column.fieldType) {
    case FieldType.Relation: return null
    case FieldType.Generated: return null
    case FieldType.Column: return column.zod
    }
  })
}

export function collectSchema(target: AnyConstructor): Schema<ColumnShape, Derivations<ColumnShape>> {
  const superCtor = superConstructor(target)
  const parentSchema = superCtor == null ? undefined : collectSchema(superCtor)
  const ownSchema = (target as any)[symbols.schema] as Schema<any, any> | undefined
  
  if (parentSchema == null && ownSchema != null) {
    return ownSchema
  } else if (parentSchema != null && ownSchema == null) {
    return parentSchema
  } else if (parentSchema != null && ownSchema != null) {
    return parentSchema.merge(ownSchema)
  } else {
    return schema({})
  }
}
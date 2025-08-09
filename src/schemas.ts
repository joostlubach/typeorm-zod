import { AnyConstructor, superConstructor } from 'ytil'
import { z } from 'zod'

import { FieldType, getMetadata } from './registry'
import { symbols } from './symbols'
import { mergeSchemas, modifySchema } from './util'

/**
 * Builds a schema for inserting an entity from an entity schema.
 * 
 * - Generated fields are allowed but made optional.
 * - Relations are omitted.
 */
export function insertSchema(schema: z.ZodObject): z.ZodObject {
  return modifySchema(schema, (type, _key) => {
    if (type instanceof z.ZodReadonly) { return null }
    if (columnOptions(type).generated != null) { return null }

    switch (fieldType(type)) {
    case FieldType.Relation: return null
    case FieldType.Generated: return type.optional()
    case FieldType.Column: return type
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
export function updateSchema(schema: z.ZodObject): z.ZodObject {
  return modifySchema(schema, type => {
    if (type instanceof z.ZodReadonly) { return null }
    if (columnOptions(type).generated != null) { return null }

    switch (fieldType(type)) {
    case FieldType.Relation: return null
    case FieldType.Generated: return null
    case FieldType.Column: return type
    }
  })
}

export function collectSchema(target: AnyConstructor): z.ZodObject {
  const superCtor = superConstructor(target)
  const parentSchema = superCtor == null ? undefined : collectSchema(superCtor)
  const ownSchema = (target as any)[symbols.schema] as z.ZodObject | undefined
  
  if (parentSchema == null && ownSchema != null) {
    return ownSchema
  } else if (parentSchema != null && ownSchema == null) {
    return parentSchema
  } else if (parentSchema != null && ownSchema != null) {
    return mergeSchemas(parentSchema, ownSchema)
  } else {
    return z.object({})
  }
}

function fieldType(type: z.ZodType): FieldType {
  const meta = getMetadata(type)
  return meta?.fieldType ?? FieldType.Column
}

function columnOptions(type: z.ZodType): Record<string, any> {
  const meta = getMetadata(type)
  return meta?.options ?? {}
}
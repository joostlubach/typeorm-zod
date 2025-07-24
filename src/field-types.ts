import { z } from 'zod'

import { symbols } from './symbols'
import { findMeta, modifySchema } from './util'

export enum FieldType {
  /**
   * Generated fields are included as a property in `tz.mixin()` helper, but are not required.
   * They MAY be specified when inserting, in which case they are validated.
   */
  Generated,

  /**
   * Regular columns are included as a property in the `tz.mixin()` helper, and are validated when
   * inserting or updating.
   */
  Column,

  /**
   * Relations are included as a property in the `tz.mixin()` helper, but are omitted from
   * validation or insertion in the database.
   */
  Relation,
}

/**
 * Builds a schema for inserting an entity from an entity schema.
 * 
 * - Generated fields are allowed but made optional.
 * - Relations are omitted.
 */
export function insertSchema(schema: z.ZodObject): z.ZodObject {
  return modifySchema(schema, type => {
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
    switch (fieldType(type)) {
      case FieldType.Relation: return null
      case FieldType.Generated: return null
      case FieldType.Column: return type
    }
  })
}

function fieldType(type: z.ZodType): FieldType {
  return findMeta(type, symbols.fieldType) ?? FieldType.Column
}
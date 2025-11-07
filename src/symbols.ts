export const symbols = {
  // -------
  // Attached to an Entity class
  // -------

  /** Holds the Zod schema of an entity class. */
  schema: 'typeorm-zod.schema' as const,

  // -------
  // Attached to the Entity prototype
  // -------

  /** Holds the function that inserts defaults after loading an entity from the DB. */
  insertDefaults: 'typeorm-zod.insert-defaults' as const,

  /** Holds the function that validates an insert operation. */
  validateInsert: 'typeorm-zod.validate-insert' as const,

  /** Holds the function that validates an update operation. */
  validateUpdate: 'typeorm-zod.validate-update' as const,
}
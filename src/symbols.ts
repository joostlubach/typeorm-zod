export const symbols = {
  // -------
  // Attached to an Entity class
  // -------

  /** Holds the Zod schema of an entity class. */
  schema: 'typeorm-zod.schema',

  // -------
  // Attached to the Entity prototype
  // -------

  /** Holds the function that validates an insert operation. */
  validateInsert: 'typeorm-zod.validate-insert',

  /** Holds the function that validates an update operation. */
  validateUpdate: 'typeorm-zod.validate-update',
}
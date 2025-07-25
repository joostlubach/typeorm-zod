export const symbols = {
  // -------
  // Attached to an Entity class
  // -------

  /** Holds the Zod schema of an entity class. */
  schema: 'typeorm-zod.schema',

  // -------
  // Attached to a field to store metadata about the field.
  // -------

  /** Holds a semantic field type, used in deriving insert / update schemas. */
  fieldType: 'typeorm-zod.field-type',

  /** Holds typeorm-specific arguments that were specified in the Zod types. Passed to the decorator factory. */
  decoratorFactoryState: 'typeorm-zod.decorator-factory-state',

  /** A special key that holds ColumnOptions within the factory state. */
  decoratorFactoryColumnOptions: 'typeorm-zod.decorator-factory-column-options',

  /** Holds the decorator factory for the type. */
  decoratorFactory: 'typeorm-zod.decorator-factory',

  // -------
  // Attached to the Entity prototype.
  // -------

  /** Holds the function that validates an insert operation. */
  validateInsert: 'typeorm-zod.validate-insert',

  /** Holds the function that validates an update operation. */
  validateUpdate: 'typeorm-zod.validate-update',
}
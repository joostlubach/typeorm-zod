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
  decoratorFactoryArgs: 'typeorm-zod.decorator-factory-args',

  /** A key for column options within the decorator factory arguments. */
  decoratorFactoryColumnOptionsArg: 'typeorm-zod.decorator-factory-column-options-arg',

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
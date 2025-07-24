import { z } from 'zod'

export class ZodValidationError<E> extends Error {

  constructor(
    public readonly entity: E,
    public readonly issues: z.core.$ZodIssue[]
  ) {
    super("Validation failed")
  }

}
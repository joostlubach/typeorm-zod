import { z } from 'zod'

export class ZodValidationError<E> extends Error {

  constructor(
    public readonly entity: E,
    public readonly issues: z.core.$ZodIssue[],
  ) {
    super(validationMessageError(entity, issues))
  }

}

function validationMessageError(entity: any, issues: z.core.$ZodIssue[]): string {
  const ctorName = 'constructor' in entity ? entity.constructor.name : "Entity"
  const entityDesc = 'id' in entity ? `${ctorName} ${entity.id}` : ctorName
  return `Validation failed (${entityDesc}): [${issues.map(issueDescriptor).join(', ')}]`
}

function issueDescriptor(issue: z.core.$ZodIssue): string {
  const detail = issue.code === 'custom' ? issue.message : issue.code
  if (issue.path.length === 0) {
    return detail
  } else {
    return `${issue.path.join('.')}: ${detail}`
  }
}
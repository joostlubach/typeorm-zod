import { BeforeInsert, BeforeUpdate, Entity, EntityOptions } from 'typeorm'
import { AnyConstructor } from 'ytil'
import { z } from 'zod'

import { ZodValidationError } from '../ZodValidationError'
import config from '../config'
import { collectSchema, insertSchema, updateSchema } from '../schemas'
import { symbols } from '../symbols'
import { ZodSchema } from './ZodSchema'

export function ZodEntity(name: string, schema: z.ZodObject, options?: EntityOptions): ClassDecorator
export function ZodEntity(schema: z.ZodObject, options?: EntityOptions): ClassDecorator
export function ZodEntity(...args: any[]): ClassDecorator {
  const name = typeof args[0] === 'string' ? args.shift() : undefined
  const schema = args.shift() as z.ZodObject
  const options = args.shift() ?? {} as EntityOptions

  return function (target: Function) {
    // Invoke the ZodSchema decorator to set the schema on the target.
    ZodSchema(schema)(target)

    // Invoke the Entity decorator.
    if (name != null) {
      Entity(name, options)(target)
    } else {
      Entity(options)(target)
    }

    // Use BeforeInsert and BeforeUpdate to run validation.
    BeforeInsert()(target.prototype, symbols.validateInsert)
    BeforeUpdate()(target.prototype, symbols.validateUpdate)

    Object.defineProperty(target.prototype, symbols.validateInsert, {
      value: function () {
        const schema = collectSchema(target as AnyConstructor)
        const result = insertSchema(schema).safeParse(this)
        if (result.success) {
          Object.assign(this, result.data)
        } else {
          const error = new ZodValidationError(this, result.error.issues)
          throw config.transformError(error)
        }
      }
    })

    Object.defineProperty(target.prototype, symbols.validateUpdate, {
      value: function () {
        const schema = collectSchema(target as AnyConstructor)
        const result = updateSchema(schema).safeParse(this)
        if (result.success) {
          Object.assign(this, result.data)
        } else {
          const error = new ZodValidationError(this, result.error.issues)
          throw config.transformError(error)
        }
      }
    })
  }
}
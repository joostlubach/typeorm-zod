import { BeforeInsert, BeforeUpdate, Entity, EntityOptions } from 'typeorm'
import { objectEntries } from 'ytil'
import { z } from 'zod'

import { ZodValidationError } from './ZodValidationError'
import config from './config'
import { insertSchema, updateSchema } from './field-types'
import { symbols } from './symbols'
import { findMeta } from './util'

export function ZodEntity(name: string, schema: z.ZodObject, options?: EntityOptions): ClassDecorator
export function ZodEntity(schema: z.ZodObject, options?: EntityOptions): ClassDecorator
export function ZodEntity(...args: any[]): ClassDecorator {
  const name = typeof args[0] === 'string' ? args.shift() : undefined
  const schema = args.shift() as z.ZodObject
  const options = args.shift() ?? {} as EntityOptions

  return function (target: Function) {
    // Set the schema on the target class.
    Object.assign(target, {[symbols.schema]: schema})

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
        const result = updateSchema(schema).safeParse(this)
        if (result.success) {
          Object.assign(this, result.data)
        } else {
          const error = new ZodValidationError(this, result.error.issues)
          throw config.transformError(error)
        }
      }
    })

    // Run through all types in the schema and run their decorators.
    for (const entry of objectEntries(schema.def.shape)) {
      const propertyName = entry[0]
      const type = entry[1] as z.ZodType

      const decorator = createFieldDecorator(type, propertyName)
      decorator?.(target.prototype, propertyName)
    }

  }
}

function createFieldDecorator(type: z.ZodType, _propertyName: string): PropertyDecorator | null {
  const factory =findMeta<(args: any) => PropertyDecorator>(type, symbols.decoratorFactory)
  if (factory == null) { return null }

  const args = findMeta<any>(type, symbols.decoratorFactoryState) ?? {}
  return factory(args)
}
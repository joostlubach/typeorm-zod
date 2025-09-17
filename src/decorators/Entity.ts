import { BeforeInsert, BeforeUpdate, Entity as typeorm_Entity, EntityOptions } from 'typeorm'

import config from '../config'
import { Schema } from '../schema'
import { symbols } from '../symbols'
import { validateInsert, validateUpdate } from '../validate'
import { EntitySchema } from './EntitySchema'

export function Entity(name: string, schema: Schema<any, any>, options?: EntityOptions): ClassDecorator
export function Entity(schema: Schema<any, any>, options?: EntityOptions): ClassDecorator
export function Entity(...args: any[]): ClassDecorator {
  const name = typeof args[0] === 'string' ? args.shift() : undefined
  const schema = args.shift() as Schema<any, any>
  const options = {
    collation: config.collation.default,
    ...args.shift() as EntityOptions,
  }

  return function (target: Function) {
    // Invoke the tz.Schema decorator to set the schema on the target.
    EntitySchema(schema)(target)

    // Invoke the Entity decorator.
    if (name != null) {
      typeorm_Entity(name, options)(target)
    } else {
      typeorm_Entity(options)(target)
    }

    if (config.useHooksForValidation) {
      // Use BeforeInsert and BeforeUpdate to run validation.
      BeforeInsert()(target.prototype, symbols.validateInsert)
      BeforeUpdate()(target.prototype, symbols.validateUpdate)
    }

    Object.defineProperty(target.prototype, symbols.validateInsert, {
      value: async function () {
        await validateInsert(this) 
      },
    })

    Object.defineProperty(target.prototype, symbols.validateUpdate, {
      value: async function () {
        await validateUpdate(this) 
      },
    })
  }
}
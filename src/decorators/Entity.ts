import { snakeCase } from 'lodash'
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Entity as typeorm_Entity,
  EntityOptions,
} from 'typeorm'

import config from '../config'
import { Schema } from '../schema'
import { symbols } from '../symbols'
import { registerEntityTableName } from '../util'
import { applyDefaults, validateInsert, validateUpdate } from '../validate'
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
    // Register the entity table name for early access during property decorator execution
    const tableName = name ?? options.name ?? snakeCase(target.name)
    registerEntityTableName(target, tableName)

    // Invoke the tz.Schema decorator to set the schema on the target.
    EntitySchema(schema)(target)

    // Invoke the Entity decorator.
    if (name != null) {
      typeorm_Entity(name, options)(target)
    } else {
      typeorm_Entity(options)(target)
    }

    // Whenever loading from the database, insert defaults if not found in the database.
    AfterLoad()(target.prototype, symbols.insertDefaults)

    if (config.useHooksForValidation) {
      // Use BeforeInsert and BeforeUpdate to run validation.
      BeforeInsert()(target.prototype, symbols.validateInsert)
      BeforeUpdate()(target.prototype, symbols.validateUpdate)
    }

    Object.defineProperty(target.prototype, symbols.insertDefaults, {
      value: function () {
        applyDefaults(this, false) 
      },
    })

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
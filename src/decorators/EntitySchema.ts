import { objectEntries } from 'ytil'

import { Schema } from '../schema'
import { symbols } from '../symbols'
import { ColumnShape, Derivations } from '../types'

export function EntitySchema(schema: Schema<ColumnShape, Derivations<ColumnShape>>): ClassDecorator {
  return function (target: Function) {
    // Set the schema on the target class.
    Object.assign(target, {[symbols.schema]: schema})

    // Run through all types in the schema and run their decorators.
    for (const [field, column] of objectEntries(schema.columns)) {
      column.buildFieldDecorator(field)?.(target.prototype, field)
      column.buildClassDecorator(field)?.(target)
    }
  }
}
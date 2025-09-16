import { IndexOptions, TableUniqueOptions } from 'typeorm'
import { EmptyObject } from 'ytil'
import { z } from 'zod'

import { Derivations, Shape } from './typings'

export function schema<S extends Shape>(shape: S): Schema<S, EmptyObject> {
  const schema = z.object(shape)
  Object.assign(schema, {
    derive,
    index,
    unique
  })
  return schema as Schema<S>
}

function derive<S extends Shape>(this: Schema<S>, derivations: Derivations<S>) {
  return this
}

function index<S extends Shape>(this: Schema<S>, name: string, options: IndexOptions | {synchronize: false} = {}) {
  return this
}

function unique<S extends Shape>(this: Schema<S>, name: string, columnNames: string[], options: IndexOptions = {}) {
  return this
}

export interface Schema<S extends Shape, D extends Derivations<S> = {}> extends z.ZodObject<S> {
  derive<DD extends Derivations<S>>(derivations: DD): Schema<S, D & DD>
  
  index(name: string, options?: IndexOptions | {synchronize: false}): this
  unique(name: string, columnNames: string[], options?: Omit<TableUniqueOptions, 'name' | 'columnNames'>): this

  readonly __shape: S
  readonly __derivations: D
}

export type EmptySchema = Schema<Record<string, never>, Record<string, never>>

export type shapeOf<S extends Schema<any, any>> = S['__shape']
export type derivationsOf<S extends Schema<any, any>> = S['__derivations']
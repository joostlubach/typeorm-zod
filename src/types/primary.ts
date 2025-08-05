import { ColumnOptions, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'
import { modifyColumnOptions } from '../registry'

export function primary<T>(base: z.ZodType<T>, options?: PrimaryColumnOptions): PrimaryColumn<T>
export function primary(base: z.ZodString, options?: PrimaryColumnOptions): PrimaryColumn<string>
export function primary(base?: z.ZodInt, options?: PrimaryColumnOptions): PrimaryColumn<number>
export function primary(base: z.ZodType = z.int().positive(), options?: PrimaryColumnOptions) {
  return buildColumnType(base, {
    decoratorFactory: primaryColumnDecorator,
    options:          {
      type: 'int',
      ...options,
    },
    modifiers: primaryModifiers,
  })
}

function generated<T>(this: PrimaryColumn<T>, strategy: 'increment', options?: PrimaryGeneratedColumnNumericOptions): PrimaryColumn<T>
function generated<T>(this: PrimaryColumn<T>, strategy: 'uuid', options?: PrimaryGeneratedColumnUUIDOptions): PrimaryColumn<T>
function generated<T>(this: PrimaryColumn<T>, strategy: 'rowid', options?: PrimaryGeneratedColumnUUIDOptions): PrimaryColumn<T>
function generated<T>(this: PrimaryColumn<T>, strategy: 'identity', options?: PrimaryGeneratedColumnIdentityOptions): PrimaryColumn<T>
function generated<T>(this: PrimaryColumn<T>, options?: PrimaryGeneratedColumnNumericOptions): PrimaryColumn<T>
function generated(this: PrimaryColumn<any>, ...args: any[]): z.ZodType<number | string> {
  const strategy = typeof args[0] === 'string' ? args.shift() : true
  const options = args[0] as PrimaryGeneratedColumnOptions | undefined

  modifyColumnOptions(this, opts => ({
    ...opts,
    decoratorFactory: primaryGeneratedColumnDecorator,
    generated:        strategy,
    ...options,
  }))
  return this
}

const primaryModifiers = {
  generated,
}

export type PrimaryModifiers = typeof primaryModifiers
export type PrimaryColumn<T> = ColumnType<z.ZodType<T>, PrimaryModifiers>

type PrimaryColumnOptions = ColumnOptions & {nullable?: false}

type PrimaryGeneratedColumnOptions = PrimaryGeneratedColumnNumericOptions | PrimaryGeneratedColumnUUIDOptions | PrimaryGeneratedColumnIdentityOptions
type PrimaryGeneratedColumnNumericOptions = typeof PrimaryGeneratedColumn extends (type: 'increment', options?: infer Opts) => any ? Opts : never
type PrimaryGeneratedColumnUUIDOptions = typeof PrimaryGeneratedColumn extends (type: 'uuid', options?: infer Opts) => any ? Opts : never 
type PrimaryGeneratedColumnIdentityOptions = typeof PrimaryGeneratedColumn extends (type: 'identity', options?: infer Opts) => any ? Opts : never

function primaryColumnDecorator(options: PrimaryColumnOptions) {
  return PrimaryColumn(options)
}

function primaryGeneratedColumnDecorator(options: PrimaryColumnOptions) {
  const {generated: strategy = 'increment', ...rest} = options
  switch (strategy) {
  case 'increment': return PrimaryGeneratedColumn('increment', rest as PrimaryGeneratedColumnNumericOptions)
  case 'uuid': return PrimaryGeneratedColumn('uuid', rest as PrimaryGeneratedColumnUUIDOptions)
  case 'rowid': return PrimaryGeneratedColumn('rowid', rest as PrimaryGeneratedColumnUUIDOptions)
  case 'identity': return PrimaryGeneratedColumn('identity', rest as PrimaryGeneratedColumnIdentityOptions)
  }
} 
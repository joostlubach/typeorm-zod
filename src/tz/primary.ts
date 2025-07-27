import { PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { z } from 'zod'

import { FieldType } from '../schemas'
import { symbols } from '../symbols'

type PrimaryColumnOptions = Parameters<typeof PrimaryColumn>[0]
type PrimaryGeneratedColumnOptions = Parameters<typeof PrimaryGeneratedColumn>[1]

export function primary<T>(base: z.ZodType<T>, options?: PrimaryColumnOptions): PrimaryColumnType<T>
export function primary(base: z.ZodString, options?: PrimaryColumnOptions): PrimaryColumnType<string>
export function primary(base?: z.ZodInt, options?: PrimaryColumnOptions): PrimaryColumnType<number>
export function primary(base: z.ZodType = z.int().positive(), options?: PrimaryColumnOptions) {
  const type = base.meta({
    [symbols.decoratorFactory]: () => PrimaryColumn(options)
  })
  Object.assign(type, {generated})
  return type as PrimaryColumnType<any>
}

function generated<T extends PrimaryColumnType<any>>(this:T, options?: PrimaryGeneratedColumnOptions): T
function generated<T extends PrimaryColumnType<any>>(this:T, strategy: 'increment' | 'uuid', options?: PrimaryGeneratedColumnOptions): T
function generated(this: PrimaryColumnType<any>, ...args: any[]): z.ZodType<number | string> {
  const strategy = typeof args[0] === 'string' ? args.shift() : undefined
  const options = args.shift() ?? {}

  return this.meta({
    [symbols.fieldType]: FieldType.Generated,
    [symbols.decoratorFactory]: () => PrimaryGeneratedColumn(strategy, options),
  })
}

export type PrimaryColumnType<T> = z.ZodType<T> & {
  generated: typeof generated
}
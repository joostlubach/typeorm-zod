import { PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { z } from 'zod'

import { symbols } from '../symbols'

type PrimaryColumnOptions = Parameters<typeof PrimaryColumn>[0]
type PrimaryGeneratedColumnOptions = Parameters<typeof PrimaryGeneratedColumn>[1]

export function primary<T>(base: z.ZodType<T>, options?: PrimaryColumnOptions): PrimaryColumnType<T>
export function primary(base: z.ZodString, options?: PrimaryColumnOptions): PrimaryColumnType<string>
export function primary(base?: z.ZodInt, options?: PrimaryColumnOptions): PrimaryColumnType<number>
export function primary(base: z.ZodType = z.int().positive(), options?: PrimaryColumnOptions) {
  const type = base.meta({
    [symbols.decorator]: PrimaryColumn(options)
  })
  Object.assign(type, {generated})
  return type as PrimaryColumnType<any>
}

function generated(this: PrimaryColumnType<any>, options?: PrimaryGeneratedColumnOptions): z.ZodType<number | string>
function generated(this: PrimaryColumnType<any>, strategy: 'increment' | 'uuid', options?: PrimaryGeneratedColumnOptions): z.ZodType<number | string>
function generated(this: PrimaryColumnType<any>, ...args: any[]): z.ZodType<number | string> {
  const strategy = typeof args[0] === 'string' ? args.shift() : undefined
  const options = args.shift() ?? {}

  return this.meta({
    [symbols.decorator]: PrimaryGeneratedColumn(strategy, options),
    [symbols.insert]: false
  })
}

export type PrimaryColumnType<T> = z.ZodType<T> & {
  generated: typeof generated
}
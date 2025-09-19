import {
  PrimaryColumn as typeorm_PrimaryColumn,
  PrimaryColumnOptions,
  PrimaryGeneratedColumn as typeorm_PrimaryGeneratedColumn,
} from 'typeorm'
import { z } from 'zod'

import { Column, ColumnOptions } from '../column'
import config from '../config'
import { FieldType } from '../types'
import { invokePropertyDecorator } from '../util'

export function primary(type: 'uuid' | 'string'): PrimaryColumn<z.ZodString>
export function primary(type?: 'int' | 'number'): PrimaryColumn<z.ZodNumber>
export function primary(
  type: 'uuid' | 'int' | 'string' | 'number' = 'int',
  options: PrimaryColumnOptions = {},
): PrimaryColumn<z.ZodType<any>> {
  const zod = type === 'uuid' || type === 'string'
    ? z.string()
    : z.int()

  return new PrimaryColumn(zod, type, options)
}

export class PrimaryColumn<T extends z.ZodType<any>> extends Column<T, false> {

  constructor(
    zod: T,
    public readonly type: 'uuid' | 'int' | 'string' | 'number',
    public readonly options: PrimaryColumnOptions = {},
  ) {
    super(zod, {})
  }

  public get columnType() {
    switch (this.type) {
    case 'uuid': case 'string':
      return config.typemap.string
    case 'number':
      return config.typemap.number
    case 'int':
      return config.typemap.int32
    }
  }

  public generated(strategy: 'increment', options?: PrimaryGeneratedColumnNumericOptions): PrimaryGeneratedColumn<this>
  public generated(strategy: 'uuid', options?: PrimaryGeneratedColumnUUIDOptions): PrimaryGeneratedColumn<this>
  public generated(strategy: 'rowid', options?: PrimaryGeneratedColumnUUIDOptions): PrimaryGeneratedColumn<this>
  public generated(strategy: 'identity', options?: PrimaryGeneratedColumnIdentityOptions): PrimaryGeneratedColumn<this>
  public generated(options?: PrimaryGeneratedColumnNumericOptions): PrimaryGeneratedColumn<this>
  public generated(...args: any[]): PrimaryGeneratedColumn<this> {
    const strategy = typeof args[0] === 'string' ? args.shift() : true
    const options = (args[0] ?? {}) as PrimaryGeneratedColumnOptions
    
    return this.transmute(PrimaryGeneratedColumn, strategy, options)
  }

  public buildFieldDecorator() {
    return (target: object, property: string | symbol) => {
      return invokePropertyDecorator(typeorm_PrimaryColumn, target, property, this.columnType, this.options)
    }
  }

}

export class PrimaryGeneratedColumn<C extends PrimaryColumn<z.ZodType<any>>> extends Column<C['zod'], true> {

  constructor(
    protected readonly base: C,
    public readonly strategy: 'increment' | 'uuid' | 'rowid' | 'identity',
    public readonly options: PrimaryGeneratedColumnOptions,
  ) {
    super(base.zod, base.options)
  }

  public get fieldType() {
    return FieldType.Generated
  }

  public buildFieldDecorator(field: string, options: ColumnOptions = {}): PropertyDecorator {
    return (target: object, property: string | symbol) => {
      return invokePropertyDecorator(typeorm_PrimaryGeneratedColumn, target, property, {
        type: this.base.columnType,
        ...options,
      })
    }
  }

}

type PrimaryGeneratedColumnOptions = PrimaryGeneratedColumnNumericOptions | PrimaryGeneratedColumnUUIDOptions | PrimaryGeneratedColumnIdentityOptions
type PrimaryGeneratedColumnNumericOptions = typeof PrimaryGeneratedColumn extends (type: 'increment', options?: infer Opts) => any ? Opts : never
type PrimaryGeneratedColumnUUIDOptions = typeof PrimaryGeneratedColumn extends (type: 'uuid', options?: infer Opts) => any ? Opts : never 
type PrimaryGeneratedColumnIdentityOptions = typeof PrimaryGeneratedColumn extends (type: 'identity', options?: infer Opts) => any ? Opts : never
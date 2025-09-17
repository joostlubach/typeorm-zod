import {
  PrimaryColumn as typeorm_PrimaryColumn,
  PrimaryColumnOptions,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { z } from 'zod'

import { Column } from '../column'
import { FieldType } from '../types'

export function primary(type: 'uuid' | 'string'): PrimaryColumn<z.ZodString>
export function primary(type?: 'int' | 'number'): PrimaryColumn<z.ZodNumber>
export function primary(
  type: 'uuid' | 'int' | 'string' | 'number' = 'int',
  options: PrimaryColumnOptions = {}
): PrimaryColumn<any> {
  const zod = type === 'uuid' || type === 'string'
    ? z.string()
    : z.int()

  return new PrimaryColumn(zod, type, options)
}

export class PrimaryColumn<T extends z.ZodType<any>> extends Column<T> {

  constructor(
    zod: T,
    private readonly type: 'uuid' | 'int' | 'string' | 'number',
    public readonly options: PrimaryColumnOptions = {}
  ) {
    super(zod, {})
  }

  public generated(strategy: 'increment', options?: PrimaryGeneratedColumnNumericOptions): this
  public generated(strategy: 'uuid', options?: PrimaryGeneratedColumnUUIDOptions): this
  public generated(strategy: 'rowid', options?: PrimaryGeneratedColumnUUIDOptions): this
  public generated(strategy: 'identity', options?: PrimaryGeneratedColumnIdentityOptions): this
  public generated(options?: PrimaryGeneratedColumnNumericOptions): this
  public generated(...args: any[]): this {
    const strategy = typeof args[0] === 'string' ? args.shift() : true
    const options = args[0] as PrimaryGeneratedColumnOptions | undefined

    this.buildFieldDecorator = this.getGeneratedFieldDecorator(strategy, options)
    return this
  }

  public buildFieldDecorator = this.buildFieldDecorator_default

  public get fieldType() {
    if (this.buildFieldDecorator === this.buildFieldDecorator_default) {
      return FieldType.Column
    } else {
      return FieldType.Generated
    }
  }

  private buildFieldDecorator_default() {
    return typeorm_PrimaryColumn(this.type, this.options)
  }

  private getGeneratedFieldDecorator(strategy: any, options?: PrimaryGeneratedColumnOptions) {
    return () => PrimaryGeneratedColumn(strategy, options)
  }

}

type PrimaryGeneratedColumnOptions = PrimaryGeneratedColumnNumericOptions | PrimaryGeneratedColumnUUIDOptions | PrimaryGeneratedColumnIdentityOptions
type PrimaryGeneratedColumnNumericOptions = typeof PrimaryGeneratedColumn extends (type: 'increment', options?: infer Opts) => any ? Opts : never
type PrimaryGeneratedColumnUUIDOptions = typeof PrimaryGeneratedColumn extends (type: 'uuid', options?: infer Opts) => any ? Opts : never 
type PrimaryGeneratedColumnIdentityOptions = typeof PrimaryGeneratedColumn extends (type: 'identity', options?: infer Opts) => any ? Opts : never
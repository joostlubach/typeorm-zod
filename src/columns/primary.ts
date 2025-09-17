import {
  PrimaryColumn as typeorm_PrimaryColumn,
  PrimaryColumnOptions,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { z } from 'zod'

import { Column } from '../column'

export class PrimaryColumn<T extends z.ZodType<any>> extends Column<T> {

  constructor(
    base: T,
    private readonly type: 'uuid' | 'int' | 'string' | 'number' = 'int',
    public readonly options: PrimaryColumnOptions = {}
  ) {
    super(base, {})
  }

  private _isGenerated: boolean = false
  public get isGenerated() { return this._isGenerated }

  public generated(strategy: 'increment', options?: PrimaryGeneratedColumnNumericOptions): this
  public generated(strategy: 'uuid', options?: PrimaryGeneratedColumnUUIDOptions): this
  public generated(strategy: 'rowid', options?: PrimaryGeneratedColumnUUIDOptions): this
  public generated(strategy: 'identity', options?: PrimaryGeneratedColumnIdentityOptions): this
  public generated(options?: PrimaryGeneratedColumnNumericOptions): this
  public generated(...args: any[]): this {
    const strategy = typeof args[0] === 'string' ? args.shift() : true
    const options = args[0] as PrimaryGeneratedColumnOptions | undefined

    this._isGenerated = true
    this.buildFieldDecorator = this.getGeneratedFieldDecorator(strategy, options)
    return this
  }

  public buildFieldDecorator = this.buildFieldDecorator_default

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
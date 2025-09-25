import { IndexOptions } from 'typeorm'
import { z } from 'zod'

import { Column, ColumnOptions, UniqueOptions } from './column'

export class NullableColumn<C extends Column<z.ZodType<any>, boolean>> extends Column<z.ZodNullable<C['zod']>> {

  constructor(private readonly base: C) {
    super(base.zod.nullable(), {
      ...base.options,
      nullable: true,
    })
  }

  public index(options?: IndexOptions): this
  public index(name: string, options?: IndexOptions): this
  public index(...args: any[]): this {
    this.base.index(...args)
    return this
  }

  public unique(options?: UniqueOptions): this
  public unique(name: string, options?: UniqueOptions): this
  public unique(...args: any[]): this {
    this.base.index(...args)
    return this
  }

  public get fieldType() {
    return this.base.fieldType
  }

  public buildFieldDecorator(field: string, options: ColumnOptions = {}): PropertyDecorator {
    return this.base.buildFieldDecorator(field, {...options, nullable: true})
  }

  public buildClassDecorator(field: string, options: ColumnOptions = {}): ClassDecorator {
    return this.base.buildClassDecorator(field, {...options, nullable: true})
  }

}
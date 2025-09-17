import { CreateDateColumn } from 'typeorm'
import { z } from 'zod'

import { Column, ColumnOptions } from '../column'
import config from '../config'

export function create_timestamp(options: ColumnOptions = {}) {
  return new CreateTimestampColumn(options)
}

export class CreateTimestampColumn extends Column<z.ZodDate> {

  constructor(
    options?: ColumnOptions
  ) {
    super(z.date(), {
      ...options,
      type: config.typemap.timestamp
    })
  }

  public buildFieldDecorator() {
    return CreateDateColumn(this.options)
  }

}

export function update_timestamp(options: ColumnOptions = {}) {
  return new UpdateTimestampColumn(options)
}

export class UpdateTimestampColumn extends Column<z.ZodDate> {

  constructor(
    options?: ColumnOptions
  ) {
    super(z.date(), {
      ...options,
      type: config.typemap.timestamp
    })
  }

  public buildFieldDecorator() {
    return CreateDateColumn(this.options)
  }

}
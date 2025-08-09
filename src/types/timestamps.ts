import { ColumnOptions, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { z } from 'zod'

import { buildColumnType } from '../column'

export function timestamp(options: ColumnOptions = {}) {
  return buildColumnType(z.date(), {
    decoratorFactory: CreateDateColumn,
    options:          {
      type: 'timestamp',
      ...options,
    },
  }).readonly()
}

export function create_date(options: ColumnOptions = {}) {
  return buildColumnType(z.date(), {
    decoratorFactory: CreateDateColumn,
    options:          {
      type: 'timestamp',
      ...options,
    },
  }).readonly()
}

export function update_date(options: ColumnOptions = {}) {
  return buildColumnType(z.date(), {
    decoratorFactory: UpdateDateColumn,
    options:          {
      type: 'timestamp',
      ...options,
    },
  }).readonly()
}
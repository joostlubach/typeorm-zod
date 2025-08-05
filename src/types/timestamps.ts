import { CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { z } from 'zod'

import { buildColumnType, ColumnType } from '../column'

export function timestamp(): ColumnType<z.ZodDate>
export function timestamp<T extends z.ZodType<any>>(type?: T): ColumnType<T>
export function timestamp<T extends z.ZodType<any>>(type?: T) {
  return buildColumnType(type ?? z.date(), {
    decoratorFactory: CreateDateColumn,
    options:          {
      type: 'timestamp',
    },
  })
}

export function create_date(): ColumnType<z.ZodDate>
export function create_date<T extends z.ZodType<any>>(type?: T): ColumnType<T>
export function create_date<T extends z.ZodType<any>>(type?: T) {
  return buildColumnType(type ?? z.date(), {
    decoratorFactory: CreateDateColumn,
    options:          {
      type: 'timestamp',
    },
  })
}

export function update_date(): ColumnType<z.ZodDate>
export function update_date<T extends z.ZodType<any>>(type?: T): ColumnType<T>
export function update_date<T extends z.ZodType<any>>(type?: T) {
  return buildColumnType(type ?? z.date(), {
    decoratorFactory: UpdateDateColumn,
    options:          {
      type: 'timestamp',
    },
  })
}
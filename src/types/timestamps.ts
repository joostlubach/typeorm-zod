import { ColumnOptions, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { z } from 'zod'

import { column, createColumnType } from '../column'
import { symbols } from '../symbols'

export function timestamp(): column<z.ZodDate>
export function timestamp<T extends z.ZodType<any>>(type?: T): column<T>
export function timestamp<T extends z.ZodType<any>>(type?: T) {
  return createColumnType(type ?? z.date(), {
    type: 'timestamp'
  }) 
}

export function create_date(): column<z.ZodDate>
export function create_date<T extends z.ZodType<any>>(type?: T): column<T>
export function create_date<T extends z.ZodType<any>>(type?: T) {
  return createColumnType(type ?? z.date(), createDateDecorator, {
    type: 'timestamp'
  }) 
}

export function update_date(): column<z.ZodDate>
export function update_date<T extends z.ZodType<any>>(type?: T): column<T>
export function update_date<T extends z.ZodType<any>>(type?: T) {
  return createColumnType(type ?? z.date(), updateDateDecorator, {
    type: 'timestamp'
  })
}

function createDateDecorator(state: any) {
  const columnOptions = (state[symbols.decoratorFactoryColumnOptions] ?? {}) as ColumnOptions
  return CreateDateColumn(columnOptions)
}

function updateDateDecorator(state: any) {
  const columnOptions = (state[symbols.decoratorFactoryColumnOptions] ?? {}) as ColumnOptions
  return UpdateDateColumn(columnOptions)
}
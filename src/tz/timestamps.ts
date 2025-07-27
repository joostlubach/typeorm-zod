import { ColumnOptions, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { z } from 'zod'

import { ColumnTypeModifiers, createColumnType } from '../column'
import { symbols } from '../symbols'

export function timestamp() {
  return createColumnType(z.date(), {
    type: 'timestamp'
  })
}

export function create_date(): z.ZodDate & ColumnTypeModifiers
export function create_date<T extends z.ZodType<any>>(type?: T): T & ColumnTypeModifiers
export function create_date<T extends z.ZodType<any>>(type?: T) {
  return createColumnType(type ?? z.date(), createDateDecorator, {    
    type: 'timestamp'
  }) 
}

export function update_date(): z.ZodDate & ColumnTypeModifiers
export function update_date<T extends z.ZodType<any>>(type?: T): T & ColumnTypeModifiers
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
import { z } from 'zod'

import { Column } from './column'
import { Schema } from './schema'

export type ColumnShape = Record<string, Column<z.ZodType<any>, boolean>>
export type Derivations<S extends ColumnShape> = {
  [K in keyof S]?: Derivation<output<S[K]>, S>
}
export type Derivation<T, S extends ColumnShape> = (obj: columnShapeOutput<S>) => T

export type input<Arg extends Schema<any, any> | ColumnShape | Column<z.ZodType<any>, boolean>> =
  Arg extends Schema<any, any> ? columnShapeInput<Arg['columns']> :
  Arg extends ColumnShape ? columnShapeInput<Arg> :
  Arg extends Column<z.ZodType<any>, boolean> ? z.input<Arg['zod']> :
  never

type columnShapeInput<S extends ColumnShape> = {
  [K in keyof S]: input<S[K]>
}

export type output<Arg extends Schema<any, any> | ColumnShape | Column<z.ZodType<any>, boolean>> =
  Arg extends Schema<any, any> ? columnShapeOutput<Arg['columns']> :
  Arg extends ColumnShape ? columnShapeOutput<Arg> :
  Arg extends Column<z.ZodType<any>, boolean> ? z.output<Arg['zod']> :
  never

type columnShapeOutput<S extends ColumnShape> = {
  [K in keyof S]: output<S[K]>
}

export enum FieldType {
  /**
   * Generated fields are included as a property in `tz.mixin()` helper, but are not required.
   * They MAY be specified when inserting, in which case they are validated.
   */
  Generated,

  /**
   * Regular columns are included as a property in the `tz.mixin()` helper, and are validated when
   * inserting or updating.
   */
  Column,

  /**
   * Relations are included as a property in the `tz.mixin()` helper, but are omitted from
   * validation or insertion in the database.
   */
  Relation,
}

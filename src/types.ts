import { z } from 'zod'

import { Column, Default, Nullable, Optional } from './column'
import { Schema } from './schema'

export type ColumnShape = Record<string, Column<any>>
export type Derivations<S extends ColumnShape> = {
  [K in keyof S]?: Derivation<output<S[K]>, S>
}
export type Derivation<T, S extends ColumnShape> = (obj: columnShapeOutput<S>) => T

export type output<Arg extends Schema<any, any> | ColumnShape | Column<any>> =
  Arg extends Schema<any, any> ? columnShapeOutput<Arg['columns']> :
  Arg extends ColumnShape ? columnShapeOutput<Arg> :
  Arg extends Optional<infer T, Column<any>> ? z.output<T> | null | undefined :
  Arg extends Nullable<infer T, Column<any>> ? z.output<T> | null :
  Arg extends Default<infer T, Column<any>> ? z.output<z.ZodDefault<T>> :
  Arg extends Column<any> ? z.output<Arg['zod']> :
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

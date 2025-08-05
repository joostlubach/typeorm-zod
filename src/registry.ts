import { ColumnOptions } from 'typeorm'
import { z } from 'zod'

const rootMap = new WeakMap<z.ZodType<any>, RootLink>()
const registry = new WeakMap<z.ZodType<any>, Metadata<any, any>>()

export function linkRoot(leaf: z.ZodType<any>, root: z.ZodType<any>): void {
  rootMap.set(leaf, {root})
}

export function tryGetMetadata<Opts extends ColumnOptions, Mod>(leaf: z.ZodType<any>): Metadata<Opts, Mod> | undefined {
  const root = rootMap.get(leaf)
  if (root == null) { return undefined }

  const meta = registry.get(root.root)
  if (meta == null) { return undefined }

  return meta as Metadata<Opts, Mod>
}

export function getMetadata<Opts extends ColumnOptions, Mod>(leaf: z.ZodType<any>): Metadata<Opts, Mod> {
  const meta = tryGetMetadata<Opts, Mod>(leaf)
  if (meta == null) {
    throw new Error("No metadata found - input must be a column type")
  }

  return meta as Metadata<Opts, Mod>
}

export function storeMetadata<Opts extends ColumnOptions, Mod>(leaf: z.ZodType<any>, metadata: Metadata<Opts, Mod>): void {
  const root = rootMap.get(leaf)
  if (root == null) {
    throw new Error("Not a column type")
  }

  registry.set(root.root, metadata)
}


export function modifyMetadata<Opts extends ColumnOptions, Mod>(type: z.ZodType<any>, modify: (prev: Metadata<Opts, Mod>) => Metadata<Opts, Mod>) {
  const prev = getMetadata<Opts, Mod>(type)
  storeMetadata(type, modify(prev))
}

export function modifyColumnOptions<T extends z.ZodType<any>>(
  type: T,
  modify: (upstream: ColumnOptions) => ColumnOptions,
) {
  modifyMetadata(type, prev => {
    return {
      ...prev,
      options: modify(prev.options ?? {}),
    }
  })
}

interface RootLink {
  root: z.ZodType<any>
}

export interface Metadata<Opts, Mod> {
  fieldType: FieldType
  decoratorFactory: (options: Opts) => PropertyDecorator
  options: Opts
  modifiers: Mod
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

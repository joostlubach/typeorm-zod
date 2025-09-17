import { ColumnOptions } from 'typeorm'
import { z } from 'zod'

import { Column, modifier } from '../column'

// #region Number

export function int(options: ColumnOptions = {}): IntColumn {
  return new NumberColumn(z.int(), {...options, type: 'int8'})
}

export function int4(options: ColumnOptions = {}): Int32Column {
  return new NumberColumn(z.int32(), {...options, type: 'int4'})
}

export function uint8(options: ColumnOptions = {}): UInt32Column {
  return new NumberColumn(z.uint32(), {...options, type: 'int8'})
}

export function float4(options: ColumnOptions = {}): Float32Column {
  return new NumberColumn(z.float32(), {...options, type: 'float4'})
}

export function float8(options: ColumnOptions = {}): Float64Column {
  return new NumberColumn(z.float64(), {...options, type: 'float8'})
}

export class NumberColumn<T extends z.ZodNumber> extends Column<T> {

  constructor(
    base: T,
    options: ColumnOptions
  ) {
    super(base, options)
  }

  public readonly gt = modifier(() => this.zod, 'gt')
  public readonly gte = modifier(() => this.zod, 'gte')
  public readonly min = modifier(() => this.zod, 'min')
  public readonly lt = modifier(() => this.zod, 'lt')
  public readonly lte = modifier(() => this.zod, 'lte')
  public readonly max = modifier(() => this.zod, 'max')
  public readonly int = modifier(() => this.zod, 'int')
  public readonly safe = modifier(() => this.zod, 'safe')
  public readonly positive = modifier(() => this.zod, 'positive')
  public readonly nonnegative = modifier(() => this.zod, 'nonnegative')
  public readonly negative = modifier(() => this.zod, 'negative')
  public readonly nonpositive = modifier(() => this.zod, 'nonpositive')
  public readonly multipleOf = modifier(() => this.zod, 'multipleOf')
  public readonly step = modifier(() => this.zod, 'step')
  public readonly finite = modifier(() => this.zod, 'finite')

  public precision(precision: number) {
    this.options.precision = precision
    return this
}

  public scale(scale: number) {
    this.options.scale = scale
    return this
  }

}

export class IntColumn extends NumberColumn<z.ZodInt> {}
export class Int32Column extends NumberColumn<z.ZodInt32> {}
export class UInt32Column extends NumberColumn<z.ZodUInt32> {}

export class Float32Column extends NumberColumn<z.ZodFloat32> {}
export class Float64Column extends NumberColumn<z.ZodFloat64> {}

// #endregion

// #region BigInt

export function bigint(options: ColumnOptions = {}): BigIntColumn {
  return new BigIntColumn({...options, type: 'bigint'})
}

export class BigIntColumn extends Column<z.ZodBigInt> {
  
  constructor(
    options: ColumnOptions
  ) {
    super(z.bigint(), options)
  }

  public readonly gt = modifier(() => this.zod, 'gt')
  public readonly gte = modifier(() => this.zod, 'gte')
  public readonly min = modifier(() => this.zod, 'min')
  public readonly lt = modifier(() => this.zod, 'lt')
  public readonly lte = modifier(() => this.zod, 'lte')
  public readonly max = modifier(() => this.zod, 'max')

}

// #endregion

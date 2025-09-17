import { ColumnOptions } from 'typeorm'
import { z } from 'zod'

import { Column, deferTo } from '../column'

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

  public readonly gt = deferTo(() => this.zod, 'gt')
  public readonly gte = deferTo(() => this.zod, 'gte')
  public readonly min = deferTo(() => this.zod, 'min')
  public readonly lt = deferTo(() => this.zod, 'lt')
  public readonly lte = deferTo(() => this.zod, 'lte')
  public readonly max = deferTo(() => this.zod, 'max')
  public readonly int = deferTo(() => this.zod, 'int')
  public readonly safe = deferTo(() => this.zod, 'safe')
  public readonly positive = deferTo(() => this.zod, 'positive')
  public readonly nonnegative = deferTo(() => this.zod, 'nonnegative')
  public readonly negative = deferTo(() => this.zod, 'negative')
  public readonly nonpositive = deferTo(() => this.zod, 'nonpositive')
  public readonly multipleOf = deferTo(() => this.zod, 'multipleOf')
  public readonly step = deferTo(() => this.zod, 'step')
  public readonly finite = deferTo(() => this.zod, 'finite')

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

  public readonly gt: typeof z.ZodBigInt.prototype.gt = deferTo(() => this.zod, 'gt')
  public readonly gte: typeof z.ZodBigInt.prototype.gte = deferTo(() => this.zod, 'gte')
  public readonly min: typeof z.ZodBigInt.prototype.min = deferTo(() => this.zod, 'min')
  public readonly lt: typeof z.ZodBigInt.prototype.lt = deferTo(() => this.zod, 'lt')
  public readonly lte: typeof z.ZodBigInt.prototype.lte = deferTo(() => this.zod, 'lte')
  public readonly max: typeof z.ZodBigInt.prototype.max = deferTo(() => this.zod, 'max')

}

// #endregion

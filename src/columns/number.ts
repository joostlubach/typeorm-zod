import { ColumnOptions, ColumnType } from 'typeorm'
import { z } from 'zod'

import { Column, modifier } from '../column'
import config from '../config'

// #region Number

export function number(type: ColumnType = config.typemap.number, options: ColumnOptions = {}): NumberColumn {
  return new NumberColumn(z.number(), {...options, type})
}

export function int32(options: ColumnOptions = {}): Int32Column {
  return new NumberColumn(z.int32(), {...options, type: config.typemap.int32})
}

export function float32(options: ColumnOptions = {}): Float32Column {
  return new NumberColumn(z.float32(), {...options, type: config.typemap.float32})
}

export function float64(options: ColumnOptions = {}): Float64Column {
  return new NumberColumn(z.float64(), {...options, type: config.typemap.float64})
}

export class NumberColumn<T extends z.ZodNumber = z.ZodNumber> extends Column<T> {

  constructor(
    base: T,
    options: ColumnOptions,
  ) {
    super(base, options)
  }

  public readonly gt = modifier<this, 'gt'>(() => this.zod, 'gt')
  public readonly gte = modifier<this, 'gte'>(() => this.zod, 'gte')
  public readonly min = modifier<this, 'min'>(() => this.zod, 'min')
  public readonly lt = modifier<this, 'lt'>(() => this.zod, 'lt')
  public readonly lte = modifier<this, 'lte'>(() => this.zod, 'lte')
  public readonly max = modifier<this, 'max'>(() => this.zod, 'max')
  public readonly int = modifier<this, 'int'>(() => this.zod, 'int')
  public readonly safe = modifier<this, 'safe'>(() => this.zod, 'safe')
  public readonly positive = modifier<this, 'positive'>(() => this.zod, 'positive')
  public readonly nonnegative = modifier<this, 'nonnegative'>(() => this.zod, 'nonnegative')
  public readonly negative = modifier<this, 'negative'>(() => this.zod, 'negative')
  public readonly nonpositive = modifier<this, 'nonpositive'>(() => this.zod, 'nonpositive')
  public readonly multipleOf = modifier<this, 'multipleOf'>(() => this.zod, 'multipleOf')
  public readonly step = modifier<this, 'step'>(() => this.zod, 'step')
  public readonly finite = modifier<this, 'finite'>(() => this.zod, 'finite')

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
    options: ColumnOptions,
  ) {
    super(z.bigint(), options)
  }

  public readonly gt = modifier<this, 'gt'>(() => this.zod, 'gt')
  public readonly gte = modifier<this, 'gte'>(() => this.zod, 'gte')
  public readonly min = modifier<this, 'min'>(() => this.zod, 'min')
  public readonly lt = modifier<this, 'lt'>(() => this.zod, 'lt')
  public readonly lte = modifier<this, 'lte'>(() => this.zod, 'lte')
  public readonly max = modifier<this, 'max'>(() => this.zod, 'max')

}

// #endregion

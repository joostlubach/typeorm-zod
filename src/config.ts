import { camelize, snakeize } from 'casing'
import { ColumnType } from 'typeorm'
import { isFunction } from 'ytil'

import * as typemaps from './typemaps'

export interface Config {
  foreignKeyNaming: ForeignKeyNaming
  foreignKeyConstraintNaming: ForeignKeyConstraintNaming
  indexNaming: IndexNaming | null

  typemap: Typemap,

  collation: {
    default: string,
    ignoreCase: string,
  }

  useHooksForValidation: boolean
  
  logger: LoggerInterface
  trace: boolean | string
}

export type ForeignKeyNaming = (relationName: string) => string

export namespace ForeignKeyNaming {
  export const CAMEL = (relationName: string) => `${camelize(relationName)}Id`
  export const SNAKE = (relationName: string) => `${snakeize(relationName)}_id`
}

export type ForeignKeyConstraintNaming = (tableName: string, field: string) => string

export namespace ForeignKeyConstraintNaming {
  export const CAMEL = (tableName: string, field: string) => `FK_${camelize(tableName)}_${camelize(field)}`
  export const SNAKE = (tableName: string, field: string) => `FK_${camelize(tableName)}_${snakeize(field)}`
}

export type IndexNaming = (tableName: string, field: string, unique: boolean) => string

export namespace IndexNaming {
  export const CAMEL = (tableName: string, field: string, unique: boolean) => `${unique ? 'UQ' : 'IDX'}_${camelize(tableName)}_${camelize(field)}`
  export const SNAKE = (tableName: string, field: string, unique: boolean) => `${unique ? 'UQ' : 'IDX'}_${camelize(tableName)}_${snakeize(field)}`
}

export interface Typemap {
  boolean: ColumnType
  number: ColumnType
  int32: ColumnType
  float: ColumnType
  float32: ColumnType
  float64: ColumnType
  enum: ColumnType
  string: ColumnType
  binary: ColumnType
  date: ColumnType
  timestamp: ColumnType
}

export interface LoggerInterface {
  log: (message?: any, ...optionalParams: any[]) => void
  info: (message?: any, ...optionalParams: any[]) => void
  warn: (message?: any, ...optionalParams: any[]) => void
  error: (message?: any, ...optionalParams: any[]) => void
}

const config: Config = {
  foreignKeyNaming:           ForeignKeyNaming.SNAKE,
  foreignKeyConstraintNaming: ForeignKeyConstraintNaming.SNAKE,
  indexNaming:                null,

  typemap: typemaps.mysql,

  collation: {
    default:    'utf8mb4_0900_as_cs',
    ignoreCase: 'utf8mb4_0900_ai_ci',
  },

  useHooksForValidation: true,
  logger:                console,
  trace:                 process.env.TYPEORM_ZOD_TRACE === '1' ? true : (process.env.TYPEORM_ZOD_TRACE ?? false),
}

export default config

export function configure(cfg: Partial<Config> | ((cfg: Config) => void)) {
  if (isFunction(cfg)) {
    cfg(config)
  } else {
    Object.assign(config, cfg)
  }
}
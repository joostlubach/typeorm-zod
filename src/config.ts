import { camelize, snakeize } from 'casing'
import { isFunction } from 'ytil'

export interface Config {
  foreignKeyNaming: ForeignKeyNaming
  indexNaming: IndexNaming | null

  collation: {
    default: string,
    ignoreCase: string,
  }

  useHooksForValidation: boolean
}

export type ForeignKeyNaming = (relationName: string) => string

export namespace ForeignKeyNaming {
  export const CAMEL = (relationName: string) => `${camelize(relationName)}Id`
  export const SNAKE = (relationName: string) => `${snakeize(relationName)}_id`
}

export type IndexNaming = (tableName: string, field: string, unique: boolean) => string

export namespace IndexNaming {
  export const CAMEL = (tableName: string, field: string, unique: boolean) => `${unique ? 'UQ' : 'IDX'}_${camelize(tableName)}_${camelize(field)}`
  export const SNAKE = (tableName: string, field: string, unique: boolean) => `${unique ? 'UQ' : 'IDX'}_${camelize(tableName)}_${snakeize(field)}`
}

const config: Config = {
  foreignKeyNaming: ForeignKeyNaming.SNAKE,
  indexNaming:      null,

  collation: {
    default:    'utf8mb4_0900_as_cs',
    ignoreCase: 'utf8mb4_0900_ai_ci',
  },

  useHooksForValidation: true,
}

export default config

export function configure(cfg: Partial<Config> | ((cfg: Config) => void)) {
  if (isFunction(cfg)) {
    cfg(config)
  } else {
    Object.assign(config, cfg)
  }
}
import { camelize, snakeize } from 'casing'
import { isFunction } from 'ytil'

export interface Config {
  foreignKeyNaming: ForeignKeyNaming
  indexNaming: IndexNaming

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

export type IndexNaming = (field: string) => string

export namespace IndexNaming {
  export const CAMEL = (field: string) => `IDX_${camelize(field)}`
  export const SNAKE = (field: string) => `IDX_${snakeize(field)}`
}

const config: Config = {
  foreignKeyNaming: ForeignKeyNaming.SNAKE,
  indexNaming:      IndexNaming.SNAKE,

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
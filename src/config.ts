import { isFunction } from 'ytil'

import { ZodValidationError } from './ZodValidationError'

export interface Config {
  foreignKeyStrategy: ForeignKeyStrategy
  defaultCollation:   string
  
  transformError: (error: ZodValidationError<any>) => Error

}

export type ForeignKeyStrategy = (relationName: string) => string

export namespace ForeignKeyStrategy {
  export const CAMEL = (relationName: string) => `${relationName}Id`
  export const SNAKE = (relationName: string) => `${relationName}_id`
}

const config: Config = {
  foreignKeyStrategy: ForeignKeyStrategy.SNAKE,
  defaultCollation:   'utf8mb4_0900_ai_ci',

  transformError: error => error
}

export default config

export function configure(cfg: Partial<Config> | ((cfg: Config) => void)) {
  if (isFunction(cfg)) {
    cfg(config)
  } else {
    Object.assign(config, cfg)
  }
}
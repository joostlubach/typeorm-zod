import { isFunction } from 'ytil'

import { ZodValidationError } from './ZodValidationError'

export interface Config {
  transformError: (error: ZodValidationError<any>) => Error
}

const config: Config = {
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
import chalk from 'chalk'
import { snakeCase } from 'lodash'
import { getMetadataArgsStorage, ObjectType } from 'typeorm'

import config from './config'

export function getTypeORMTableName(Entity: ObjectType<object>) {
  const {tables} = getMetadataArgsStorage() 
  const entry = tables.find(it => it.target === Entity)
  if (entry?.name != null) { return entry.name }

  return snakeCase(Entity.name)
}

export function invokePropertyDecorator(decorator: (...args: any[]) => PropertyDecorator, target: object, property: string | symbol, ...args: Parameters<typeof decorator>): void {
  trace(decorator, target, property, args)
  decorator(...args)(target, property)
}

export function invokeClassDecorator(decorator: (...args: any[]) => ClassDecorator, target: Function, ...args: Parameters<typeof decorator>): void {
  trace(decorator, target, undefined, args)
  decorator(...args)(target)
}

function trace(decorator: Function, target: object | Function, property: string | symbol | undefined, args: any[]) {
  if (config.trace === false) { return }

  const ctorName = target instanceof Function ? target.name : target.constructor.name
  const qualifier = [ctorName, property && String(property)].filter(Boolean).join('.')
  if (typeof config.trace === 'string') {
    const regexp = new RegExp(config.trace, 'i')
    if (!regexp.test(qualifier)) { return }
  }

  const padding = ' '.repeat(Math.max(0, 26 - qualifier.length))
  config.logger.info(chalk`{dim [TRACE]} [{underline ${qualifier}}]${padding} @{bold ${decorator.name}}({gray ${JSON.stringify(args)}})`)
}
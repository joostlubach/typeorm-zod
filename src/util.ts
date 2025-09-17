import { snakeCase } from 'lodash'
import { getMetadataArgsStorage, ObjectType } from 'typeorm'

export function getTypeORMTableName(Entity: ObjectType<object>) {
  const {tables} = getMetadataArgsStorage() 
  const entry = tables.find(it => it.target === Entity)
  if (entry?.name != null) { return entry.name }

  return snakeCase(Entity.name)
}
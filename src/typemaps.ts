import { Typemap } from './config'

export const postgres: Typemap = {
  boolean:   'bool',
  number:    'int4',
  int32:     'int4',
  float:     'float4',
  float32:   'float4',
  float64:   'float8',
  string:    'varchar',
  binary:    'blob',
  date:      'timestamp',
  timestamp: 'timestamp',
}

export const mysql: Typemap = {
  boolean:   'tinyint',
  number:    'int',
  int32:     'int',
  float:     'float',
  float32:   'float',
  float64:   'double',
  string:    'varchar',
  binary:    'binary',
  date:      'datetime',
  timestamp: 'timestamp',
}
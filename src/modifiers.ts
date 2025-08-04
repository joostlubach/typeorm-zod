import { ColumnOptions } from 'typeorm'
import { AnyFunction, objectEntries } from 'ytil'
import { z } from 'zod'

import { symbols } from './symbols'
import { column, ModifiersInput } from './typings'

export function modifierOption<N extends string, A extends any[], T extends z.ZodType<any>, R extends z.ZodType<any>>(
  name: N,
  append: (upstream: ColumnOptions) => ColumnOptions
): T {
  return null as unknown as T
}

export function appendColumnOption<T extends z.ZodType<any>>(
  base: T,
  append: (upstream: ColumnOptions) => ColumnOptions
): T {
  const upstream = base.meta() ?? {}
  const upstreamState: Record<string, any> = upstream[symbols.decoratorFactoryState] ?? {}

  const type = base.meta({
    ...upstream,
    [symbols.decoratorFactoryState]: {
      ...upstreamState,
      [symbols.decoratorFactoryColumnOptions]: {
        ...upstreamState[symbols.decoratorFactoryColumnOptions],
        ...append(upstream[symbols.decoratorFactoryColumnOptions] ?? {})
      }
    }
  })

  return wrapColumnType(type, base)
}

export function wrapColumnType<T extends z.ZodType<any>, Mod>(type: T, base: z.ZodType<any>, additionalModifiers: ModifiersInput<Mod> = {} as ModifiersInput<Mod>): column<T, Mod> {
  if (base != null) {
    Object.defineProperty(type, 'unwrap', () => base)
  }

  const originalModifiers = type.meta()?.[symbols.modifiers] ?? {}
  const allModifiers = {...originalModifiers, ...additionalModifiers}
  for (const [key, value] of objectEntries(allModifiers)) {
    Object.defineProperty(type, key, {
      value: wrapColumnTypeModifier(type, value),
      writable: true,
      configurable: true,
      enumerable: false
    })
  }

  return type as column<T, Mod>
}

function wrapColumnTypeModifier<T extends z.ZodType<any>>(type: T, modifier: AnyFunction): AnyFunction {
  return function (...args: any[]) {
    const retval = modifier.apply(type, args)
    if (retval instanceof z.ZodType) {
      return wrapColumnType(retval as z.ZodType<any>, type)
    } else {
      return retval
    }
  }
}
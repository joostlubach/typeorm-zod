import { AnyConstructor } from 'ytil'
import { z } from 'zod'

export function mixin<S, Ctor extends AnyConstructor>(schema: z.ZodType<S>, base: Ctor): MixedIn<typeof schema, Ctor>
export function mixin<S>(schema: z.ZodType<S>): MixedIn<typeof schema, AnyConstructor>
export function mixin(_schema: z.ZodType, base?: AnyConstructor) {
  return base ?? Object
}

type MixedIn<S, Ctor extends AnyConstructor> = 
  & Ctor
  & (new (...args: ConstructorParams<Ctor>) => InstanceType<Ctor> & z.infer<S> & {__schema: S})

type ConstructorParams<C extends AnyConstructor> = C extends new (...args: infer A) => any ? A : never

export type schemaOf<T> = T extends { __schema: infer S } ? S : never
export type attributesOf<T> = T extends { __schema: infer S } ? z.infer<S> : never
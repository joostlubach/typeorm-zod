import { FindOptionsWhere } from 'typeorm'
import { AnyConstructor } from 'ytil'
import { z } from 'zod'

import { int } from './number'
import { string } from './string'

export function mixin<S, Ctor extends AnyConstructor>(schema: z.ZodType<S>, Base: Ctor): MixedIn<typeof schema, Ctor>
export function mixin<S>(schema: z.ZodType<S>): MixedIn<typeof schema, ObjectConstructor>
export function mixin(_schema: z.ZodType, Base?: AnyConstructor) {
  return Base ?? Object
}

type MixedIn<S, Ctor extends AnyConstructor> =
  ObjectConstructor extends Ctor ? (
    & (new (...args: ConstructorParams<Ctor>) => z.infer<S>)
    & {__schema: S}
  ) : (
    & (new (...args: ConstructorParams<Ctor>) => InstanceType<Ctor> & z.infer<S>)
    & {__schema: S}
  )

type ConstructorParams<C extends AnyConstructor> = C extends new (...args: infer A) => any ? A : never

export type schemaOf<T> = T extends { __schema: infer S } ? S : never
export type attributesOf<T> = T extends { __schema: infer S } ? z.infer<S> : never

// Here be some typing assertions

const base = z.object({id: int()})
const user = z.object({email: string(z.email())})
class Base extends mixin(base) {}
class NonTZBase {}

class User1 extends mixin(user, Base) {}
class User2 extends mixin(user, NonTZBase) {}
class User3 {

  email!: string 

}

const _where1a: FindOptionsWhere<User1> = {email: 'test@example.com'}
const _where2a: FindOptionsWhere<User2> = {email: 'test@example.com'}
const _where3a: FindOptionsWhere<User3> = {email: 'test@example.com'}

// @ts-expect-error
const _where1b: FindOptionsWhere<User1> = {email: 1}
// @ts-expect-error
const _where2b: FindOptionsWhere<User2> = {email: 2}
// @ts-expect-error
const _where3b: FindOptionsWhere<User3> = {email: 3}
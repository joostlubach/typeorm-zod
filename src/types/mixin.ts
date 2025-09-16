import { FindOptionsWhere } from 'typeorm'
import { AnyConstructor } from 'ytil'
import { z } from 'zod'

import { boolean } from './boolean'
import { int } from './number'
import { string } from './string'

export function mixin<S extends z.ZodRawShape, Ctor extends AnyConstructor>(schema: z.ZodObject<S>, Base: Ctor): MixedIn<(typeof schema)['shape'], Ctor>
export function mixin<S extends z.ZodRawShape>(schema: z.ZodObject<S>): MixedIn<(typeof schema)['shape'], ObjectConstructor>
export function mixin(_schema: z.ZodObject, Base?: AnyConstructor) {
  return Base ?? Object
}

type MixedIn<S extends z.ZodRawShape, Ctor extends AnyConstructor> =
  ObjectConstructor extends Ctor ? (
    & (new (...args: ConstructorParams<Ctor>) => attributesOf<{__schema: S}> & {readonly __schema: S})
    & {readonly __schema: S}
  ) : (
    & (new (...args: ConstructorParams<Ctor>) => InstanceType<Ctor> & attributesOf<{__schema: S}> & {readonly __schema: S})
    & {readonly __schema: S}
  )

type ConstructorParams<C extends AnyConstructor> = C extends new (...args: infer A) => any ? A : never

export type schemaOf<T> =
  T extends { __schema: infer S extends z.ZodRawShape } ? S :
  never
export type attributesOf<T> =
  T extends { __schema: infer S extends z.ZodRawShape } ? markDerivedAsReadonly<z.infer<z.ZodObject<S>>, S> :
  never
export type inputOf<T> =
  T extends { __schema: infer S extends z.ZodRawShape } ? omitDerived<z.infer<z.ZodObject<S>>, S> :
  never

type markDerivedAsReadonly<A, S> = {
  [K in (keyof A & keyof S) as S[K] extends {__derived: true} ? never : K]: A[K]
} & {
  readonly [K in (keyof A & keyof S) as S[K] extends {__derived: true} ? K : never]: A[K]
}

type omitDerived<A, S> = {
  [K in (keyof A & keyof S) as S[K] extends {__derived: true} ? never : K]: A[K]
}

// Here be some typing assertions

const base = z.object({
  id: int()
})

const user = z.object({
  email: string(z.email()),
  active: boolean().derive(() => true)
})

class Base extends mixin(base) {}
class NonTZBase {
  id!: number
}

class User1 extends mixin(user, Base) {}
class User2 extends mixin(user, NonTZBase) {}
class User3 {
  email!: string 
}

type User1Input = inputOf<User1>
type User2Input = inputOf<User2>
type User3Input = inputOf<User3>

const _i1: User1Input = {id: 1, email: 'test@example.com'}
const _i2: User2Input = {email: 'test@example.com'}
// @ts-expect-error
const _i3: User3Input = {email: 'test@example.com'}

type User1Attributes = attributesOf<User1>
type User2Attributes = attributesOf<User2>
type User3Attributes = attributesOf<User3>

const _a1: User1Attributes = {id: 1, email: 'test@example.com', active: true}
const _a2: User2Attributes = {email: 'test@example.com', active: true}
// @ts-expect-error
const _a3: User3Attributes = {email: 'test@example.com', active: true}

const user1 = new User1()
// @ts-expect-error
user1.active = true

const _where1a: FindOptionsWhere<User1> = {id: 1, email: 'test@example.com'}
const _where2a: FindOptionsWhere<User2> = {id: 1, email: 'test@example.com'}
const _where3a: FindOptionsWhere<User3> = {email: 'test@example.com'}

// @ts-expect-error
const _where1b: FindOptionsWhere<User1> = {email: 1}
// @ts-expect-error
const _where2b: FindOptionsWhere<User2> = {email: 2}
// @ts-expect-error
const _where3b: FindOptionsWhere<User3> = {email: 3}
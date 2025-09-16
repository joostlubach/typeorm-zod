import { FindOptionsWhere } from 'typeorm'
import { AnyConstructor, ConstructorParams } from 'ytil'
import { z } from 'zod'

import { derivationsOf, schema, Schema, shapeOf } from './schema'
import { symbols } from './symbols'
import { boolean, int, string } from './types'

export function mixin<S extends Schema<any, any>, Ctor extends AnyConstructor>(schema: S, Base: Ctor): Mixin<typeof schema, Ctor>
export function mixin<S extends Schema<any, any>>(schema: S): Mixin<typeof schema, ObjectConstructor>
export function mixin(_schema: z.ZodObject, Base?: AnyConstructor) {
  return Base ?? Object
}

/**
 * tz.Mixin<Schema, Base> mixes in the attributes of Schema into Base.
 * 
 * Note that it adds the pseudo property [symbols.schema] to the class and any instance. At runtime, the schema is only
 * added to the class, but since TS does not keep the typed constructors for class instances, instead falling back to 
 * `Function`, we need to store this type information on the instances as well, except there it is never added at runtime.
 */
export type Mixin<S extends Schema<any, any>, Base extends AnyConstructor> = (
  ObjectConstructor extends Base ? (
    & (
      new (...args: ConstructorParams<Base>) => (
        // Mixin all attributes of the schema.
        & attributesOf<{[symbols.schema]: S}>

        // Expose the schema as a readonly (virtual) property on all instances. Note that this property is not there
        // at runtime. See the note above for why this is unfortunately necessary.
        & {readonly [symbols.schema]: S}
      )
    )
    // Also expose the schema as a readonly (virtual) property on all classes.
    // Note that @tz.EntitySchema() will actually add this, so at runtime you can typically expect this to be there.
    // Note also that here we manually merge both schemas, in the instance type, TypeScript does that for us.
    & {
      readonly [symbols.schema]: S
    }
  ) : (
    & (
      new (...args: ConstructorParams<Base>) => (
        // We're returning the constructor unchanged, so it should keep its default behavior.
        & InstanceType<Base>

        // Mixin all attributes of the schema.
        & attributesOf<{[symbols.schema]: S}>

        // Expose the schema as a readonly (virtual) property on all instances. Note that this property is not there
        // at runtime. See the note above for why this is unfortunately necessary.
        & {readonly [symbols.schema]: S}
      )
    )
    // Also expose the schema as a readonly (virtual) property on all classes.
    // Note that @tz.EntitySchema() will actually add this, so at runtime you can typically expect this to be there.
    // Note also that here we manually merge both schemas, in the instance type, TypeScript does that for us.
    & {
      readonly [symbols.schema]: Base extends {[symbols.schema]: infer BS} ? BS & S : S
    }
  )
)

/**
 * Extracts the schema from a given entity instance or class.
 * */
export type schemaOf<T> =
  T extends { [symbols.schema]: infer S extends Schema<any, any> }
    ? S
    : never

/**
 * Retrieves the attributes of any instance of entities created with the given schema. Derived properties
 * are marked as readonly here.
 */
export type attributesOf<T> = schemaOf<T> extends never
  ? T
  : markDerivedAsReadonly<schemaOf<T>>

/**
 * Retrieves the input shape of entities created with the given schema. Derived properties are excluded
 * here.
 */
export type inputOf<T> = schemaOf<T> extends never
  ? T
  : omitDerived<schemaOf<T>>

/**
 * Utility type to mark all derived properties from the schema as readonly.
 */
type markDerivedAsReadonly<S extends Schema<any, any> | never> = S extends never ? never : {
  [K in keyof shapeOf<S> as (K extends keyof derivationsOf<S> ? never : K)]: z.infer<shapeOf<S>[K]>
} & {
  readonly [K in keyof shapeOf<S> as (K extends keyof derivationsOf<S> ? K : never)]: z.infer<shapeOf<S>[K]>
}

/**
 * Utility type to omit all derived properties from the schema.
 */
type omitDerived<S extends Schema<any, any> | never> = S extends never ? never : {
  [K in keyof shapeOf<S> as (K extends keyof derivationsOf<S> ? never : K)]: z.infer<shapeOf<S>[K]>
}

// #region Type assertions

const base = schema({
  id: int()
})

const user = schema({
  email: string(z.email()),
  active: boolean()
}).derive({
  active: () => true
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

// Check 1 - schemaOf<Class> <==> schemaOf<type Class>

type BaseSchema1 = schemaOf<Base>
type User1Schema1 = schemaOf<User1>
type User2Schema1 = schemaOf<User2>
type User3Schema1 = schemaOf<User3>

type BaseSchema2 = schemaOf<typeof Base>
type User1Schema2 = schemaOf<typeof User1>
type User2Schema2 = schemaOf<typeof User2>
type User3Schema2 = schemaOf<typeof User3>

type BaseShape = shapeOf<BaseSchema1>
type User1Shape = shapeOf<User1Schema1>
type User2Shape = shapeOf<User2Schema1>
type User3Shape = shapeOf<User3Schema1>

type BaseDerivations = derivationsOf<BaseSchema1>
type User1Derivations = derivationsOf<User1Schema1>
type User2Derivations = derivationsOf<User2Schema1>
type User3Derivations = derivationsOf<User3Schema1>

const _sa1: BaseSchema1 = {} as BaseSchema2
const _sa2: User1Schema1 = {} as User1Schema2
const _sa3: User2Schema1 = {} as User2Schema2
const _sa4: User3Schema1 = {} as User3Schema2

const _sb1: BaseSchema2 = {} as BaseSchema1
const _sb2: User1Schema2 = {} as User1Schema1
const _sb3: User2Schema2 = {} as User2Schema1
const _sb4: User3Schema2 = {} as User3Schema1

// Check 2 - Inputs

type User1Input = inputOf<User1> // {id: number, email: string}
type User2Input = inputOf<User2> // {email: string}
type User3Input = inputOf<User3> // {email: string} (falls back on TS shape)

const _i1ok: User1Input = {id: 1, email: 'test@example.com'}
const _i2ok: User2Input = {email: 'test@example.com'}
const _i3ok: User3Input = {email: 'test@example.com'}

// @ts-expect-error
const _i1err1: User1Input = {id: '1', email: 'test@example.com'}
// @ts-expect-error
const _i1err2: User1Input = {id: '1', email: 100}
// @ts-expect-error
const _i2err1: User2Input = {email: 100}
// @ts-expect-error
const _i3err1: User3Input = {unknown: 'test'}

// Check 3 - Attributes

type User1Attributes = attributesOf<User1> // {id: number, email: string, readonly active: boolean}
type User2Attributes = attributesOf<User2> // {email: string, readonly active: boolean}
type User3Attributes = attributesOf<User3> // {email: string} (falls back on TS shape)

const _a1ok: User1Attributes = {id: 1, email: 'test@example.com', active: true}
const _a2ok: User2Attributes = {email: 'test@example.com', active: true}
const _a3ok: User3Attributes = {email: 'test@example.com'}

// @ts-expect-error
const _a1err1: User1Attributes = {id: '1', email: 'test@example.com', active: true}
// @ts-expect-error
const _a1err2: User1Attributes = {id: '1', email: 100, active: true}
// @ts-expect-error
const _a1err3: User1Attributes = {id: '1', email: 'test@example.com', active: 'true'}
// @ts-expect-error
const _a2err1: User2Attributes = {email: 100, active: true}
// @ts-expect-error
const _a2err2: User2Attributes = {email: 'test@example.com', active: 'true'}
// @ts-expect-error
const _a3err1: User3Attributes = {unknown: 'test@example.com'}

// Check 3 - Object assignments

const user1 = new User1()
user1.id = 5
user1.email = 'alice@example.com'
// @ts-expect-error
user1.id = '5'
// @ts-expect-error
user1.email = 100
// @ts-expect-error
user1.active = true

// Check 4 - FindOptionsWhere

const _where1a: FindOptionsWhere<User1> = {id: 1, email: 'test@example.com'}
const _where2a: FindOptionsWhere<User2> = {id: 1, email: 'test@example.com'}
const _where3a: FindOptionsWhere<User3> = {email: 'test@example.com'}

// @ts-expect-error
const _where1b: FindOptionsWhere<User1> = {email: 1}
// @ts-expect-error
const _where2b: FindOptionsWhere<User2> = {email: 2}
// @ts-expect-error
const _where3b: FindOptionsWhere<User3> = {email: 3}

// #endregion
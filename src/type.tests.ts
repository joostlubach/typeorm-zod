import { FindOptionsWhere } from 'typeorm'
import { z } from 'zod'

import { boolean, int32, string } from './columns'
import { mixin } from './mixin'
import { attributesOf, columnsOf, derivationsOf, inputOf, schema, schemaOf } from './schema'

// #region Type assertions

const base = schema({
  id: int32(),
})

const user = schema({
  email:  string(z.email()),
  active: boolean(),
}).derive({
  active: (obj) => obj.email != null,
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

type BaseShape = columnsOf<BaseSchema1>
type User1Shape = columnsOf<User1Schema1>
type User2Shape = columnsOf<User2Schema1>
type User3Shape = columnsOf<User3Schema1>

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

const x = z.object({email: z.string()})
type T = z.input<typeof x>

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

// #region Schema

const t1 = int32()
const t2 = t1.nonnegative()
const t3 = t2.nullable()
const t4 = t3.index()

const s1_ok1 = schema({
  foo: string(),
}).derive({
  foo: () => 'test',
})

const s1_ok2 = schema({
  foo: string().optional(),
}).derive({
  foo: () => undefined,
})

const s1_ok3 = schema({
  foo: string().optional(),
}).derive({
  foo: () => undefined,
})

const s1_ok4 = schema({
  foo: string().optional(),
}).derive({
  foo: () => 'test',
})

const s1_ok5 = schema({
  foo: string().nullable(),
}).derive({
  foo: () => null,
})

const s1_ok6 = schema({
  foo: string().nullable(),
}).derive({
  foo: () => 'test',
})

const s1_err1 = schema({
  foo: string(),
}).derive({
  // @ts-expect-error
  foo: () => null,
})

const s1_err2 = schema({
  foo: string(),
}).derive({
  // @ts-expect-error
  foo: () => 1,
})

const s1_err3 = schema({
  foo: string().optional(),
}).derive({
  // @ts-expect-error
  foo: () => 1,
})

// #endregion
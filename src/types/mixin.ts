import { AnyConstructor, Constructor } from 'ytil'
import { z } from 'zod'

export function mixin<S, Ctor extends AnyConstructor>(schema: z.ZodType<S>, base: Ctor): Ctor & (new (...args: ConstructorParams<Ctor>) => InstanceType<Ctor> & z.infer<typeof schema>)
export function mixin<S>(schema: z.ZodType<S>): Constructor<z.infer<typeof schema>>
export function mixin(schema: z.ZodType, base?: AnyConstructor) {
  return base ?? Object
}

type ConstructorParams<C extends AnyConstructor> = C extends new (...args: infer A) => any ? A : never
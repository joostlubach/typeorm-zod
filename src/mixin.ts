import { AnyConstructor, ConstructorParams } from 'ytil'
import { z } from 'zod'

import { attributesOf, schema, Schema } from './schema'
import { symbols } from './symbols'

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
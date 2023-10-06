import { parseSchema } from "json-schema-to-zod";

export function parseOneOf(schema, refs) {
  return schema.oneOf.length
    ? schema.oneOf.length === 1
      ? parseSchema(
          schema.oneOf[0],
          Object.assign(Object.assign({}, refs), {
            path: [...refs.path, "oneOf", 0],
          })
        )
      : `z.any().transform((x, ctx) => {
    const schemas = [${schema.oneOf.map((schema, i) =>
      parseSchema(
        schema,
        Object.assign(Object.assign({}, refs), {
          path: [...refs.path, "oneOf", i],
        })
      )
    )}];
    const {errors, results} = schemas.reduce(
      ({errors, results}, schema) =>
        ((result) => ({
            errors: "error" in result ? [...errors, result.error] : errors,
            results: "error" in result ? results : [...results, result.data],
        }))(
          schema.safeParse(x)
        ),
      {errors: [], results: []}
    );
    if (schemas.length - errors.length !== 1) {
      ctx.addIssue({
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema",
      });
    }
    
    return results[0];
  })`
    : "z.any()";
}

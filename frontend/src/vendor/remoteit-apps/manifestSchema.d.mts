// The portal's declarations for manifestSchema.mjs (remoteit/apps schema/manifest.schema.json, compiled by ajv to
// standalone code by the vendor script): kept by the vendor script.
export type SchemaError = { instancePath: string; message?: string; params?: Record<string, any> }
declare const validate: ((data: unknown) => boolean) & { errors?: SchemaError[] | null }
export default validate
export { validate }

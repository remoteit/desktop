/* What a probe of graphql's schema reads (__type), and a call built from it. The portal is released apart from graphql,
   so a feature that arrives with a newer API names only the fields it has and types its variables as it types them. */

export type TypeRef = { kind: string; name?: string | null; ofType?: TypeRef | null }
export type SchemaField = { name: string; type?: TypeRef; args?: { name: string; type: TypeRef }[] }

// The type under its NON_NULL and LIST wrappers.
export const named = (type?: TypeRef | null): TypeRef | undefined =>
  type?.ofType ? named(type.ofType) : type || undefined

// A type as a variable declares it: [Int!]!, String, …
export const typeString = (type: TypeRef): string => {
  if (type.kind === 'NON_NULL') return `${typeString(type.ofType as TypeRef)}!`
  if (type.kind === 'LIST') return `[${typeString(type.ofType as TypeRef)}]`
  return type.name || 'String'
}

// A query or mutation as the API declares it: the variables given that it takes, typed as it types them.
export function buildCall(
  operation: 'query' | 'mutation',
  field: SchemaField,
  variables: ILookup<any>,
  selection: string
): { query: string; variables: ILookup<any> } {
  const args = (field.args || []).filter(arg => variables[arg.name] !== undefined || arg.type.kind === 'NON_NULL')
  const declared = args.map(arg => `$${arg.name}: ${typeString(arg.type)}`).join(', ')
  const passed = args.map(arg => `${arg.name}: $${arg.name}`).join(', ')
  const returned = named(field.type)?.kind === 'OBJECT' || !field.type ? (selection ? ` { ${selection} }` : '') : ''
  const used: ILookup<any> = {}
  for (const arg of args) used[arg.name] = variables[arg.name]
  const title = field.name.charAt(0).toUpperCase() + field.name.slice(1)
  return {
    query: `${operation} ${title}${declared ? `(${declared})` : ''} {
      ${field.name}${passed ? `(${passed})` : ''}${returned}
    }`,
    variables: used,
  }
}

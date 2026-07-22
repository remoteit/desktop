import 'i18next'

// Only the default namespace is declared. Full `resources` key-typing was
// evaluated but rejected: it forces t() return types into a union of the
// catalog's value shapes (strings, arrays, nested objects), which breaks the
// many existing call sites that assume `t()` returns a string and the dynamic
// (computed) keys used for notices and API-enum mapping. Key correctness and
// en↔ja↔de↔es parity are enforced by the CI catalog-check script instead.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'app'
  }
}

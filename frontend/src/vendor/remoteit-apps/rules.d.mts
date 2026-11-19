// The portal's declarations for rules.mjs (vendored from remoteit/apps lib/rules.mjs): kept by the vendor script.
// A manifest is plain JSON, so it is typed loosely here; the schema and these rules are what say its shape.
type Manifest = Record<string, any>
type Setting = Record<string, any>
export const REMOTEIT: string[]
export const COMMAND_OSES: string[]
export function listenersOf(m: Manifest): { named: boolean; list: Record<string, any>[] }
export function servicesOf(m: Manifest): Record<string, any>[]
export function rangeOf(ports: string | undefined): [number, number] | undefined
export function portSetting(port: unknown): string | undefined
export function semanticErrors(m: Manifest, readFile: (path: string) => string): string[]
export function commandFor(m: Manifest, os: string): string | undefined
export function valueSchema(s: Setting): Record<string, any>
export function settingProblem(s: Setting, value: unknown): string | undefined
export function defaultOf(s: Setting): unknown
export function settingFrom(s: Setting, raw: string): unknown
export function choicesOf(s: Setting): { value: string; label: string }[]
export function render(template: string, settings: Record<string, unknown>, remoteit: Record<string, unknown>): string
export const ICON_BYTES_MOST: number
export const ICON_SIDE_LEAST: number
export const ICON_SIDE_MOST: number
export function iconProblem(bytes: Uint8Array): string | undefined
export function climbs(path: unknown): boolean

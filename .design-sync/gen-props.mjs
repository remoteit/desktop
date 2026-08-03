/**
 * Generates cfg.dtsPropsFor from the emitted declarations in ds-types/.
 *
 * Why: the converter looks for a `<Name>Props` type. This codebase uses several
 * other shapes — a local `Props`, an inline `React.FC<{…}>` literal, or a props
 * type imported from a sibling module. Rather than hand-write 60 contracts, we
 * lift the REAL declared shape out of the emitted declarations.
 *
 * Run from desktop/ AFTER emitting declarations (see NOTES.md):
 *   npx tsc -p frontend/tsconfig.json --emitDeclarationOnly --declaration \
 *     --noEmit false --outDir ds-types --skipLibCheck
 *   node .design-sync/gen-props.mjs
 */
import fs from 'fs'
import path from 'path'

const cfg = JSON.parse(fs.readFileSync('.design-sync/config.json', 'utf8'))

/** Balanced { … } starting at/after idx. */
const braceBody = (src, idx) => {
  const open = src.indexOf('{', idx)
  if (open < 0) return null
  let d = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') d++
    else if (src[i] === '}' && --d === 0) return src.slice(open + 1, i)
  }
  return null
}

/** Balanced < … > immediately following idx. */
const angleArg = (src, idx) => {
  const open = src.indexOf('<', idx)
  if (open < 0) return null
  let d = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '<') d++
    else if (src[i] === '>' && --d === 0) return src.slice(open + 1, i).trim()
  }
  return null
}

const clean = body => body.split('\n').map(l => l.trim()).filter(Boolean)

/** Resolve a named type to its member body, following relative imports. */
function resolveNamed(file, typeName, seen = new Set()) {
  const key = file + '#' + typeName
  if (seen.has(key) || !fs.existsSync(file)) return null
  seen.add(key)
  const s = fs.readFileSync(file, 'utf8')
  const local = new RegExp(`(?:type|interface)\\s+${typeName}\\b`).exec(s)
  if (local) {
    const body = braceBody(s, local.index)
    if (body) {
      const head = s.slice(local.index, s.indexOf('{', local.index))
      const inter = /=\s*([^{]+?)&\s*$/.exec(head)
      return { body: clean(body), also: inter ? inter[1].split('=').pop().trim() : null }
    }
  }
  const imp = new RegExp(`import\\s*\\{[^}]*\\b${typeName}\\b[^}]*\\}\\s*from\\s*['"](\\.[^'"]+)['"]`).exec(s)
  if (imp) {
    const target = path.resolve(path.dirname(file), imp[1])
    for (const cand of [target + '.d.ts', path.join(target, 'index.d.ts')])
      if (fs.existsSync(cand)) return resolveNamed(cand, typeName, seen)
  }
  return null
}

const props = {}, unresolved = [], notComponent = []
for (const [name, src] of Object.entries(cfg.componentSrcMap)) {
  if (!src) continue // null = deliberately excluded (e.g. Attribute, a helper fn)
  const dts = 'ds-types/' + src.replace(/^frontend\//, '').replace(/\.tsx?$/, '.d.ts')
  if (!fs.existsSync(dts)) { unresolved.push(`${name} (no ${dts})`); continue }
  const s = fs.readFileSync(dts, 'utf8')

  const decl = new RegExp(`declare const ${name}\\s*:\\s*([\\s\\S]{0,120}?)[<;=]`).exec(s)
  if (decl && /^\s*\(/.test(decl[1])) { notComponent.push(name); continue }

  let found = null

  // 1) <Name>Props, then this repo's bare `Props`.
  for (const tn of [`${name}Props`, 'Props']) {
    const m = new RegExp(`(?:type|interface)\\s+${tn}\\b`).exec(s)
    if (!m) continue
    const body = braceBody(s, m.index)
    if (!body) continue
    const head = s.slice(m.index, s.indexOf('{', m.index))
    const inter = /=\s*([^{]+?)&\s*$/.exec(head)
    found = { body: clean(body), also: inter ? inter[1].trim() : null }
    break
  }

  // 2) The component's own generic argument: inline literal, or a named type.
  if (!found) {
    const dm = new RegExp(`declare const ${name}\\s*:`).exec(s)
    const arg = dm ? angleArg(s, dm.index) : null
    if (arg) {
      if (arg.startsWith('{')) {
        const body = braceBody(arg, 0)
        if (body) found = { body: clean(body), also: null }
      } else {
        // Unwrap ForwardRefExoticComponent<Omit<X, "ref"> & …>
        const inner = /Omit<\s*(\w+)\s*,/.exec(arg)
        const id = inner ? inner[1] : (/^(\w+)$/.exec(arg)?.[1] ?? null)
        if (id) found = resolveNamed(dts, id)
      }
    }
  }

  // 3) Fallbacks for the remaining declaration shapes.
  if (!found) {
    const stmt = (() => {
      const i = s.indexOf(`declare const ${name}`)
      if (i < 0) return null
      // Scan to the ';' that ends the declaration, ignoring ones nested inside
      // braces or type arguments — these declarations span many lines.
      let b = 0, a = 0
      for (let j = i; j < s.length; j++) {
        const c = s[j]
        if (c === '{') b++
        else if (c === '}') b--
        else if (c === '<') a++
        else if (c === '>') a--
        else if (c === ';' && b === 0 && a <= 0) return s.slice(i, j)
      }
      return s.slice(i)
    })()
    if (stmt) {
      // 3a) Generic function component annotated with a named props type,
      //     e.g. ({…}: DeviceListProps<TOptions>) => JSX.Element
      const named = /:\s*(\w*Props)\s*[<)]/.exec(stmt)
      if (named) found = resolveNamed(dts, named[1])

      // 3b) Inline intersections of object literals inside
      //     ForwardRefExoticComponent<… & {…} & {…} & RefAttributes<…>>
      if (!found) {
        const parts = []
        for (let i = stmt.indexOf('{'); i >= 0; i = stmt.indexOf('{', i + 1)) {
          const b = braceBody(stmt, i)
          if (!b) continue
          parts.push(...clean(b))
          i += b.length
        }
        if (parts.length) found = { body: [...new Set(parts)], also: null }
      }
    }
  }

  if (!found || !found.body.length) { unresolved.push(name); continue }
  props[name] = (found.also ? [`/** Also accepts: ${found.also} */`] : []).concat(found.body).join('\n')
}

cfg.dtsPropsFor = props
fs.writeFileSync('.design-sync/config.json', JSON.stringify(cfg, null, 2) + '\n')
console.log('dtsPropsFor:', Object.keys(props).length, '/', Object.keys(cfg.componentSrcMap).length)
if (notComponent.length) console.log('NOT REACT COMPONENTS:', notComponent.join(', '))
if (unresolved.length) console.log('unresolved:', unresolved.join(', '))

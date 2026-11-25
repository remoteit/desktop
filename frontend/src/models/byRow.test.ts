import { describe, it, expect, vi, beforeEach } from 'vitest'

/* EVERYTHING THE STORE KEEPS OF AN ACCOUNT IS KEPT BY ROW (helpers/rowKey): an organization two people signed in here
   both belong to is two rows of the switcher, and each holds what its own sign-in was given — its networks, files,
   jobs, tags, products, partner stats, service types and the organization itself, with that sign-in's role. The real
   store, its effects and selectors; only the requests are stood in for, each answered by who it was asked as. */

const { post, asked } = vi.hoisted(() => ({ post: vi.fn(), asked: [] as [query: string, sub: string][] }))

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('../services/post', () => ({
  post,
  postFile: async () => 'ERROR',
  apiError: vi.fn(),
  resetErrorCount: vi.fn(),
}))

import { store } from '../store'
import { rowKey } from '../helpers/rowKey'
import { selectNetworks } from '../selectors/networks'
import { selectFiles, selectJobs } from '../selectors/scripting'
import { selectTags } from '../selectors/tags'
import { getProducts } from '../selectors/products'
import { getPartnerStats } from './partnerStats'
import { selectApplicationTypesGrouped } from '../selectors/applications'
import { selectOrganization, selectPermissions, selectRole } from '../selectors/organizations'
import { selectConnection, selectConnectionSessions, selectConnections, selectSessions } from '../selectors/connections'
import { actingFor, requestSignIn, resetNotedAccounts, selectActiveRowKey } from '../selectors/signIns'
import { resetElsewhere } from '../services/elsewhere'

const { dispatch } = store
const WORK = 'sub-work'
const ACME_AS_WORK = rowKey('acme', WORK)
const who = (sub: string) => (sub ? 'work' : 'me')

const member = (id: string, roleId: string) =>
  ({ account: { id, email: '' }, name: id, roleId, roleName: roleId, created: new Date(1) } as IMembership)

// What a sign-in is given of an account: everything named for who asked.
const given = (sub: string) => {
  const as = who(sub)
  const organization = {
    organization: {
      id: 'acme',
      name: `Acme as ${as}`,
      created: '2026-01-01',
      members: [
        {
          user: { id: as, email: `${as}@x.test` },
          customRole: { id: 'GUEST', name: 'Guest' },
          license: 'LICENSED',
          created: '2026-01-01',
        },
      ],
      roles: [
        { id: 'role-admin', name: 'Admin', permissions: ['VIEW', 'CONNECT', 'MANAGE', 'ADMIN'] },
        { id: 'role-guest', name: 'Guest', permissions: ['VIEW'] },
      ],
    },
    licenses: [],
    limits: [{ name: 'seen-by', value: as, actual: 0 }],
  }
  return {
    data: {
      data: {
        login: {
          _0: organization,
          _1: organization,
          _2: organization,
          account: {
            networks: [
              {
                id: `net-${as}`,
                name: as,
                owner: { id: 'acme' },
                permissions: [],
                connections: [],
                access: [],
                tags: [],
              },
            ],
            files: [{ id: `file-${as}`, name: as, executable: false, versions: { items: [] } }],
            jobs: { total: 1, items: [{ id: `job-${as}`, jobDevices: [] }] },
            tags: [{ name: `tag-${as}`, color: 1, created: '2026-01-01' }],
            deviceProducts: { items: [{ id: `product-${as}`, name: as, services: [] }] },
            partnerEntities: [{ id: `partner-${as}`, name: as, children: [] }],
            applicationTypes: [{ id: sub ? 28 : 4, name: as, port: 1, proxy: false, scheme: '', protocol: 'TCP' }],
            devices: { total: 0, items: [] },
          },
        },
      },
    },
  }
}

const queryName = (query: string) => /(?:query|mutation)\s+(\w+)/.exec(query)?.[1] || query.trim().slice(0, 20)
const answerAll = () =>
  post.mockImplementation(async (data: { query: string; variables: any }, _path, _silent, _retry, requestFor) => {
    // As services/post does: what an effect sends for the row it acts for is that row's sign-in's (sendAs).
    const sub = requestSignIn(store.getState(), actingFor(requestFor), data.variables) ?? ''
    asked.push([queryName(data.query), sub])
    const answer: any = given(sub)
    // A connection made, and ended, as whoever asks.
    if (/mutation\s+\w*\s*\(?[^{]*\{\s*connect\(/.test(data.query))
      return {
        data: {
          data: { connect: { id: `session-${who(sub)}`, created: 1, timeout: 60, port: 1, host: `${who(sub)}.proxy` } },
        },
      }
    if (/\bdisconnect\(/.test(data.query)) return { data: { data: { disconnect: true } } }
    // A product of the organization both belong to that only Work's role is given.
    if (data.variables?.id === 'product-sibling') {
      const theirs = sub === WORK && data.variables.accountId === 'acme'
      answer.data.data.login.account.deviceProducts.items = theirs
        ? [{ id: 'product-sibling', name: 'theirs', services: [] }]
        : []
    }
    // A product only Work is given, of an organization only Work belongs to: no row here is known to hold it.
    if (data.variables?.id === 'product-elsewhere') {
      const theirs = !!sub && data.variables.accountId === 'labs'
      answer.data.data.login.account.deviceProducts.items = theirs
        ? [{ id: 'product-elsewhere', name: 'theirs', services: [] }]
        : []
    }
    return answer
  })

const state = () => store.getState()
const names = (list: { id?: string; name?: string }[]) => list.map(item => item.id ?? item.name)
// What the page shows of the selected row, model by model.
const shown = () => ({
  networks: names(selectNetworks(state())),
  files: names(selectFiles(state())),
  jobs: names(selectJobs(state())),
  tags: names(selectTags(state())),
  products: names(getProducts(state())),
  partners: names(getPartnerStats(state()).all),
  types: selectApplicationTypesGrouped(state()).map(type => type.name),
  organization: selectOrganization(state()).name,
})
const all = (as: string) => ({
  networks: [`net-${as}`],
  files: [`file-${as}`],
  jobs: [`job-${as}`],
  tags: [`tag-${as}`],
  products: [`product-${as}`],
  partners: [`partner-${as}`],
  types: [as],
  organization: `Acme as ${as}`,
})
// Every key each model keeps something under.
const keys = () => {
  const { networks, files, jobs, tags, products, partnerStats, organization, applicationTypes } = state()
  const of = (byRow: object) => Object.keys(byRow).sort().join(' ')
  return {
    networks: of(networks.all),
    files: of(files.all),
    jobs: of(jobs.all),
    tags: of(tags.all),
    products: of(products),
    partnerStats: of(partnerStats),
    organization: of(organization.accounts),
    applicationTypes: of(applicationTypes.account),
  }
}
const settled = () => new Promise(resolve => setTimeout(resolve, 20))

// A row picked in the switcher, and everything a page of it reads, read.
async function look(sub: string) {
  await dispatch.accounts.selectAs({ accountId: 'acme', sub })
  await dispatch.jobs.fetchIfEmpty()
  await dispatch.applicationTypes.fetch()
  await settled()
}

beforeEach(async () => {
  resetNotedAccounts()
  resetElsewhere()
  post.mockReset()
  asked.length = 0
  answerAll()
  ;(['devices', 'networks', 'files', 'jobs', 'tags', 'products', 'partnerStats', 'applicationTypes'] as const).forEach(
    model => dispatch[model].reset()
  )
  dispatch.organization.reset()
  dispatch.sessions.reset()
  dispatch.connections.reset()
  dispatch.accounts.reset()
  dispatch.auth.set({ user: { id: 'personal' } as IUser })
  // Personal is the page's own person, an admin of Acme; Work is signed in beside them, a guest of it.
  dispatch.accounts.set({
    membership: [member('acme', 'role-admin')],
    signIns: { [WORK]: { sub: WORK, id: 'work', email: 'work@x.test', membership: [member('acme', 'role-guest')] } },
  })
})

describe('an organization two sign-ins reach, one row under each', () => {
  it('holds what each was given at once, shows each when its row is picked, and reads nothing again', async () => {
    await dispatch.organization.fetch()
    await look('')
    expect(shown()).toEqual(all('me'))
    await look(WORK)
    expect(shown()).toEqual(all('work'))

    // Both rows are held, each under its own key, in every model.
    const both = `acme ${ACME_AS_WORK}`
    expect(keys()).toMatchObject({
      networks: both,
      files: both,
      jobs: both,
      tags: both,
      products: `${both} default`,
      partnerStats: `${both} default`,
      applicationTypes: both,
    })
    expect(Object.keys(state().organization.accounts)).toEqual(expect.arrayContaining(['acme', ACME_AS_WORK]))
    // Each was asked as its own sign-in.
    const reads = ['Networks', 'Files', 'Jobs', 'Tags', 'DeviceProducts', 'PartnerEntities', 'ApplicationTypes']
    reads.forEach(read => expect(asked.filter(([query]) => query === read).map(([, sub]) => sub)).toContain(WORK))
    reads.forEach(read => expect(asked.filter(([query]) => query === read).map(([, sub]) => sub)).toContain(''))

    const before = asked.length
    await look('')
    expect(shown()).toEqual(all('me'))
    await look(WORK)
    expect(shown()).toEqual(all('work'))
    await look('')
    // The service types alone are asked for by the page each time (look), as on any visit.
    expect(asked.slice(before).map(([query]) => query)).toEqual(Array(3).fill('ApplicationTypes'))
  })

  it('allows what the selected row’s own role allows', async () => {
    await dispatch.organization.fetch()
    await look('')
    expect(selectRole(state()).id).toBe('role-admin')
    expect(selectPermissions(state())).toContain('ADMIN')
    expect(selectOrganization(state()).members[0].user.email).toBe('me@x.test')
    expect(selectOrganization(state()).limits[0].value).toBe('me')
    await look(WORK)
    expect(selectRole(state()).id).toBe('role-guest')
    expect(selectPermissions(state())).toEqual(['VIEW'])
    expect(selectOrganization(state()).members[0].user.email).toBe('work@x.test')
    expect(selectOrganization(state()).limits[0].value).toBe('work')
  })

  it('writes an answer that lands after the row changed into the row that asked', async () => {
    await look('')
    const late: Record<string, (value: unknown) => void> = {}
    post.mockImplementation(
      (data: { query: string }) => new Promise(resolve => (late[queryName(data.query)] = resolve))
    )
    // Asked as the page's own person, each for their row.
    void dispatch.networks.fetch()
    void dispatch.files.fetch()
    void dispatch.jobs.fetch()
    void dispatch.tags.fetch()
    void dispatch.products.fetch()
    void dispatch.partnerStats.fetch()
    void dispatch.applicationTypes.fetch()
    await vi.waitFor(() => expect(Object.keys(late)).toHaveLength(7))
    answerAll()
    await look(WORK)
    expect(shown()).toEqual({ ...all('work'), organization: '' })
    // They answer now, with something only the page's own person is given.
    const mine = given('')
    mine.data.data.login.account.networks[0].id = 'net-late'
    mine.data.data.login.account.files[0].id = 'file-late'
    mine.data.data.login.account.jobs.items[0].id = 'job-late'
    mine.data.data.login.account.tags[0].name = 'tag-late'
    mine.data.data.login.account.deviceProducts.items[0].id = 'product-late'
    mine.data.data.login.account.partnerEntities[0].id = 'partner-late'
    mine.data.data.login.account.applicationTypes[0].name = 'type-late'
    Object.values(late).forEach(answer => answer(mine))
    await settled()
    // The row looked at is as it was.
    expect(shown()).toEqual({ ...all('work'), organization: '' })
    // And theirs holds it.
    await look('')
    expect(shown()).toEqual({
      networks: ['net-late'],
      files: ['file-late'],
      jobs: ['job-late'],
      tags: ['tag-late'],
      products: ['product-late'],
      partners: ['partner-late'],
      types: ['me'],
      organization: '',
    })
  })

  it('drops the rows of a sign-in that leaves, of every model, and no other', async () => {
    await dispatch.organization.fetch()
    await look('')
    await look(WORK)
    const before = asked.length
    await dispatch.accounts.setSignIns({})
    await settled()
    expect(keys()).toEqual({
      networks: 'acme',
      files: 'acme',
      jobs: 'acme',
      tags: 'acme',
      products: 'acme default',
      partnerStats: 'acme default',
      organization: 'acme personal',
      applicationTypes: 'acme',
    })
    // Still selected, through the page's own person's row, shown as it was read.
    expect(shown()).toEqual(all('me'))
    expect(asked.slice(before).map(([query]) => query)).toEqual(['Organizations'])
  })

  it('lists the connections and the sessions of the selected row', async () => {
    const connection = (id: string, sub?: string) => ({
      id,
      accountId: 'acme',
      enabled: true,
      ...(sub === undefined ? {} : { sub }),
    })
    const session = (id: string, sub?: string) => ({
      id,
      target: { id: `svc-${id}`, accountId: 'acme' },
      ...(sub === undefined ? {} : { sub }),
    })
    dispatch.connections.set({
      all: [connection('c-mine', ''), connection('c-works', WORK), connection('c-older')] as IConnection[],
    })
    dispatch.sessions.set({
      all: [
        session('s-mine', ''),
        session('s-works', WORK),
        session('s-both', ''),
        session('s-both', WORK),
      ] as ISession[],
    })
    await look('')
    // One that says no sign-in was stored before they were said: the page's own person's, who belongs to its account.
    expect(names(selectConnections(state()))).toEqual(['c-mine', 'c-older'])
    expect(names(selectSessions(state()))).toEqual(['s-mine', 's-both'])
    await look(WORK)
    expect(names(selectConnections(state()))).toEqual(['c-works'])
    expect(names(selectSessions(state()))).toEqual(['s-works', 's-both'])
  })
})

describe('one sign-in in use', () => {
  it('keeps each account’s data under the account’s own id, as ever', async () => {
    dispatch.accounts.set({ signIns: {} })
    await dispatch.organization.fetch()
    await dispatch.accounts.select('acme')
    await dispatch.jobs.fetchIfEmpty()
    await dispatch.applicationTypes.fetch()
    await settled()
    expect(keys()).toEqual({
      networks: 'acme',
      files: 'acme',
      jobs: 'acme',
      tags: 'acme',
      products: 'acme default',
      partnerStats: 'acme default',
      organization: 'acme personal',
      applicationTypes: 'acme',
    })
    expect(new Set(asked.map(([, sub]) => sub))).toEqual(new Set(['']))
  })
})

describe('what an effect sends after waiting', () => {
  it('goes as the row it began in, though another row is picked before it is sent', async () => {
    await dispatch.organization.fetch()
    await look(WORK)
    asked.length = 0
    // Begun in Work's row: it writes first, and sends once that is done.
    const saving = dispatch.organization.setOrganization({ name: 'Renamed' })
    await dispatch.accounts.selectAs({ accountId: 'acme', sub: '' })
    await saving
    expect(asked.find(([query]) => query === 'SetOrganization')).toEqual(['SetOrganization', WORK])
  })
})

describe('an organization two sign-ins reach that is not the selected one', () => {
  it('has what is read of it in the background read into both rows, each as its own sign-in', async () => {
    await dispatch.accounts.select('personal')
    await settled()
    asked.length = 0
    await dispatch.organization.fetch()
    await dispatch.sessions.fetch()
    expect(Object.keys(state().organization.accounts).sort()).toEqual(
      ['acme', ACME_AS_WORK, 'personal', rowKey('work', WORK)].sort()
    )
    expect(state().organization.accounts.acme.name).toBe('Acme as me')
    expect(state().organization.accounts[ACME_AS_WORK].name).toBe('Acme as work')
    expect(asked.sort()).toEqual(
      [
        ['Organizations', ''],
        ['Organizations', WORK],
        ['Sessions', ''],
        ['Sessions', WORK],
      ].sort()
    )
    // Asked about by its id alone, it is looked at through the page's own person's row, who belongs to it.
    expect(requestSignIn(state(), undefined, { accountId: 'acme' })).toBeUndefined()
  })
})

describe('a page opened at the address of something no row here is known to hold', () => {
  const labs = () =>
    dispatch.accounts.set({
      signIns: {
        [WORK]: {
          sub: WORK,
          id: 'work',
          email: 'work@x.test',
          membership: [member('acme', 'role-guest'), member('labs', 'role-admin')],
        },
      },
    })
  const reads = () => asked.filter(([query]) => query === 'DeviceProduct')

  it('is looked for as the other sign-ins: found, its row is selected, and it is that row’s from then on', async () => {
    labs()
    await look('')
    asked.length = 0
    const product = await dispatch.products.fetchSingle('product-elsewhere')
    expect(product).toMatchObject({ id: 'product-elsewhere' })
    // Asked as the row looked at, then of the other rows in the sign-ins' order, until one sees it.
    expect(reads()[0]).toEqual(['DeviceProduct', ''])
    expect(reads()[reads().length - 1]).toEqual(['DeviceProduct', WORK])
    // The row that sees it is the selected one, and holds it: what is asked of it next is that sign-in's.
    expect(selectActiveRowKey(state())).toBe(rowKey('labs', WORK))
    expect(names(getProducts(state()))).toContain('product-elsewhere')
    expect(requestSignIn(state(), undefined, { id: 'product-elsewhere' })).toBe(WORK)
    // Known now: read again, it is one request.
    asked.length = 0
    await dispatch.products.fetchSingle('product-elsewhere')
    expect(reads()).toEqual([['DeviceProduct', WORK]])
  })

  it('is found in the other account’s row of the SAME organization, where the row landed on does not have it', async () => {
    // A link that names the organization lands on the page's own person's row of it.
    await dispatch.accounts.select('personal')
    await dispatch.accounts.select('acme')
    await settled()
    expect(selectActiveRowKey(state())).toBe('acme')
    asked.length = 0
    expect(await dispatch.products.fetchSingle('product-sibling')).toMatchObject({ id: 'product-sibling' })
    expect(selectActiveRowKey(state())).toBe(ACME_AS_WORK)
    expect(reads()[0]).toEqual(['DeviceProduct', ''])
    expect(reads()[reads().length - 1]).toEqual(['DeviceProduct', WORK])
    expect(names(getProducts(state()))).toContain('product-sibling')
    // The page's own person's row of it is as it was.
    expect(names(state().products.acme.all)).not.toContain('product-sibling')
  })

  it('is not looked for elsewhere when it is found, nor again once it was found nowhere', async () => {
    labs()
    await look('')
    asked.length = 0
    await dispatch.products.fetchSingle('product-me')
    expect(reads()).toEqual([['DeviceProduct', '']])
    asked.length = 0
    post.mockImplementation(async (data: { query: string }, _path, _silent, _retry, requestFor) => {
      asked.push([queryName(data.query), requestFor?.sub ?? ''])
      const answer = given('')
      answer.data.data.login.account.deviceProducts.items = []
      return answer
    })
    expect(await dispatch.products.fetchSingle('product-nowhere')).toBeNull()
    expect(reads().length).toBeGreaterThan(1)
    expect(selectActiveRowKey(state())).toBe('acme')
    asked.length = 0
    await dispatch.products.fetchSingle('product-nowhere')
    expect(reads()).toHaveLength(1)
  })

  // Already another row's — read there, and so known —, and opened at its address with a different row looked at (a
  // notification's link): asked of the row that has it, which is then the one selected.
  it('is found in the row known to hold it, when another row is looked at', async () => {
    labs()
    await look('')
    await dispatch.products.fetchSingle('product-elsewhere')
    expect(selectActiveRowKey(state())).toBe(rowKey('labs', WORK))
    await look('')
    expect(selectActiveRowKey(state())).toBe('acme')
    asked.length = 0
    expect(await dispatch.products.fetchSingle('product-elsewhere')).toMatchObject({ id: 'product-elsewhere' })
    expect(selectActiveRowKey(state())).toBe(rowKey('labs', WORK))
    // The row looked at, then the one that has it: no one else is asked.
    expect(reads()).toEqual([
      ['DeviceProduct', ''],
      ['DeviceProduct', WORK],
    ])
  })

  it('is looked for again once another account is in use: found nowhere is said of those who were asked', async () => {
    // Work belongs to Acme alone, and has no such product there: asked, and found nowhere.
    dispatch.accounts.set({
      signIns: { [WORK]: { sub: WORK, id: 'work', email: 'work@x.test', membership: [member('acme', 'role-guest')] } },
    })
    await look('')
    expect(await dispatch.products.fetchSingle('product-elsewhere')).toBeNull()
    asked.length = 0
    expect(await dispatch.products.fetchSingle('product-elsewhere')).toBeNull()
    expect(reads().filter(([, sub]) => sub === WORK)).toEqual([])
    // Work joins Labs, which has it: Labs was not asked before.
    labs()
    expect(await dispatch.products.fetchSingle('product-elsewhere')).toMatchObject({ id: 'product-elsewhere' })
    expect(selectActiveRowKey(state())).toBe(rowKey('labs', WORK))
  })

  it('is looked for again where a sign-in could not be asked: a failed read is not a miss', async () => {
    labs()
    await look('')
    asked.length = 0
    // Work cannot be reached: nothing says the product is not theirs.
    const answering = post.getMockImplementation()!
    post.mockImplementation(async (data: any, path, silent, retry, requestFor) =>
      requestFor?.sub === WORK && data.variables?.id === 'product-elsewhere'
        ? 'ERROR'
        : answering(data, path, silent, retry, requestFor)
    )
    expect(await dispatch.products.fetchSingle('product-elsewhere')).toBeNull()
    expect(selectActiveRowKey(state())).toBe('acme')
    // Reached again, the page opened again: asked again, and found.
    post.mockImplementation(answering)
    expect(await dispatch.products.fetchSingle('product-elsewhere')).toMatchObject({ id: 'product-elsewhere' })
    expect(selectActiveRowKey(state())).toBe(rowKey('labs', WORK))
  })

  it('is one request, as ever, with one sign-in in use — and a change is never looked for elsewhere', async () => {
    dispatch.accounts.set({ signIns: {} })
    await dispatch.accounts.select('acme')
    await settled()
    asked.length = 0
    await dispatch.products.fetchSingle('product-elsewhere')
    expect(reads()).toEqual([['DeviceProduct', '']])
    labs()
    asked.length = 0
    post.mockImplementation(async (data: { query: string }) => {
      asked.push([queryName(data.query), ''])
      return 'ERROR'
    })
    await dispatch.tags.create({ tag: { name: 'new', color: 1 } as ITag })
    expect(asked).toEqual([['SetTag', '']])
  })
})

describe('a service two rows both hold', () => {
  const SERVICE = { id: 'svc-1', deviceID: 'dev-1', typeID: 28, attributes: {}, state: 'active' } as unknown as IService
  const record = (sub?: string): IConnection => ({
    id: 'svc-1',
    deviceID: 'dev-1',
    name: 'shared',
    accountId: 'acme',
    typeID: 28,
    public: true,
    enabled: true,
    ...(sub ? { sub } : {}),
  })
  const records = () => state().connections.all.map(c => [c.id, c.sub, c.sessionId, !!c.connected])
  const mine = () => selectConnection(state(), SERVICE)

  it('has a connection from each, each made, listed, ended and forgotten as its own sign-in', async () => {
    await look('')
    asked.length = 0
    await dispatch.connections.proxyConnect(record())
    await look(WORK)
    // Not the other row's to see: this row has none of its own yet.
    expect(mine().sessionId).toBeUndefined()
    await dispatch.connections.proxyConnect(record(WORK))
    await settled()
    // Two records of the one service — its id is the service's in both — each connected as its own sign-in.
    expect(records()).toEqual([
      ['svc-1', undefined, 'session-me', true],
      ['svc-1', WORK, 'session-work', true],
    ])
    expect(asked.filter(([query]) => /connect/i.test(query)).map(([, sub]) => sub)).toEqual(['', WORK])
    expect(names(selectConnections(state()))).toEqual(['svc-1'])
    expect(mine()).toMatchObject({ sub: WORK, sessionId: 'session-work', host: 'work.proxy' })
    await look('')
    expect(mine()).toMatchObject({ sessionId: 'session-me', host: 'me.proxy' })
    expect(mine().sub).toBeUndefined()

    // A session from each sign-in pairs with its own record: one line in each row, not two.
    const session = (sub: string) => ({ id: `session-${who(sub)}`, sub, target: { id: 'svc-1', accountId: 'acme' } })
    dispatch.sessions.set({ all: [session(''), session(WORK)] as ISession[] })
    expect(selectConnectionSessions(state()).map(s => s.id)).toEqual(['session-me'])
    await look(WORK)
    expect(selectConnectionSessions(state()).map(s => s.id)).toEqual(['session-work'])

    // Ended as Work: the page's own person's is as it was.
    asked.length = 0
    await dispatch.connections.proxyDisconnect(mine())
    await settled()
    expect(asked.filter(([query]) => /disconnect/i.test(query)).map(([, sub]) => sub)).toEqual([WORK])
    expect(records()[0]).toEqual(['svc-1', undefined, 'session-me', true])
    expect(records()[1][3]).toBe(false)
    // Forgotten as Work: one record left, the other's.
    await dispatch.connections.forget(mine())
    expect(records()).toEqual([['svc-1', undefined, 'session-me', true]])
    await look('')
    await dispatch.connections.forget('svc-1')
    expect(records()).toEqual([])
  })

  it('is stored for one sign-in exactly as it ever was: no sign-in said', async () => {
    dispatch.accounts.set({ signIns: {} })
    await dispatch.accounts.select('acme')
    await dispatch.connections.proxyConnect(record())
    await settled()
    const [stored] = state().connections.all
    expect(state().connections.all).toHaveLength(1)
    expect(stored.id).toBe('svc-1')
    expect('sub' in stored).toBe(false)
  })
})

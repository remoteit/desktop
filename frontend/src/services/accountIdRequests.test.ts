import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

/* WHOSE REQUEST IS IT? A request that says no sign-in of its own is made as the row its `accountId` variable names is
   looked at through (selectors/signIns requestSignIn). That is right where the variable IS whose request it is — "this
   account's devices, as this account is looked at". It is wrong where the variable is DATA: the account a network
   takes devices of, the person an admin looks up. Sent as that account's sign-in, such a request is refused, or
   worse, answered for the wrong person.

   So every GraphQL document in src that declares $accountId is listed here as one or the other:
     asker  — the variable is whose request it is; nothing more to say.
     target — the variable is data: the call must say who asks, with an explicit `sub`, `account` or `about`
              (a RequestFor) on the request that carries the document. */

const TARGET = [
  'AddNetworkTag',
  'AdminDevices',
  'AdminUser',
  'AdminUserDevices',
  'AdminUsers',
  'CreateNetworkDeviceRule',
  'RemoveNetworkTag',
  'SetExitSuspended',
]

const ASKER = [
  'AccountExits',
  'AccountProxies',
  'AccountSlug',
  'AccountSlugAvailable',
  'AddTag',
  'AppCatalog',
  'AppPublisher',
  'AppReleaseUploads',
  'AppTargets',
  'ApplicationTypes',
  'CatalogApp',
  'Claim',
  'CloseOrganization',
  'CreateDeviceProduct',
  'CreateDeviceProductFromRegistration',
  'CreateExit',
  'CreateFileUpload',
  'CreateNetwork',
  'CreateProxy',
  'CreateRole',
  'DaemonSettings',
  'DeleteTag',
  'Device',
  'DeviceCount',
  'DeviceList',
  'DeviceNetworks',
  'DevicePreload',
  'DeviceProduct',
  'DeviceProductPolicy',
  'DeviceProducts',
  'DeviceSetup',
  'DisabledDevices',
  'DuplicateCopies',
  'FileSizes',
  'FileStorage',
  'FileVersions',
  'Files',
  'Guests',
  'HeldByProduct',
  'JobDevice',
  'JobDevices',
  'JobRunOutput',
  'JobRuns',
  'JobTargets',
  'Jobs',
  'MergeTag',
  'MultiPortServices',
  'NetworkExits',
  'Networks',
  'OrganizationContact',
  'OrganizationContacts',
  'PartnerEntities',
  'ProductChoices',
  'ProductMaxDevices',
  'ProductProxies',
  'ProxyBase',
  'Registration',
  'RemoveAccountProxyBase',
  'RemoveMembers',
  'RemoveRole',
  'RemoveTag',
  'RenameTag',
  'RequestOrganizationClosure',
  'ResellerReportUrl',
  'Restore',
  'RoleSshAdmin',
  'ServiceShortcuts',
  'SetAccountAppChannel',
  'SetAccountProxyBase',
  'SetAccountSlug',
  'SetDaemonSettings',
  'SetIdentityProvider',
  'SetMember',
  'SetOrganization',
  'SetRoleSshAdmin',
  'SetTag',
  'TaggedInto',
  'TransferUsage',
  'UpdateCreditCard',
  'UpdateRole',
  'User',
  'VerifyAccountProxyBase',
]

const SRC = join(__dirname, '..')
const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'i18n' ? [] : sources(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })

// Each document that declares $accountId: its operation, where it is, and the call that follows its text.
const documents = sources(SRC).flatMap(path => {
  const text = readFileSync(path, 'utf8')
  return [...text.matchAll(/\b(?:query|mutation)\s+(\w+)\s*\(([^)]*)\)/g)]
    .filter(match => match[2].includes('$accountId'))
    .map(match => {
      const end = text.indexOf('`', match.index! + match[0].length)
      const rest = text.slice(end, end + 420)
      const stop = rest.search(/\nexport |\n}\n/)
      return { operation: match[1], file: relative(SRC, path), call: stop < 0 ? rest : rest.slice(0, stop) }
    })
})

describe('a request that carries an accountId says whether it is the asker or data', () => {
  it('finds the documents', () => {
    expect(documents.length).toBeGreaterThan(80)
  })

  it('has every such operation classified, and nothing classified that is gone', () => {
    const found = [...new Set(documents.map(document => document.operation))].sort()
    const unclassified = found.filter(operation => !TARGET.includes(operation) && !ASKER.includes(operation))
    expect(
      unclassified,
      `These operations declare $accountId and are not classified: ${unclassified.join(', ')}.\n` +
        'Add each to ASKER in src/services/accountIdRequests.test.ts if the variable is whose request it is (the ' +
        'request is made as that account is looked at), or to TARGET if it is data — and then pass an explicit ' +
        'identity ({ sub }, { account } or { about: [...] }) on the request, or it is sent as the wrong person.'
    ).toEqual([])
    const gone = [...TARGET, ...ASKER].filter(operation => !found.includes(operation))
    expect(gone, `No document declares $accountId under these names any more: remove them from the table.`).toEqual([])
    expect(TARGET.filter(operation => ASKER.includes(operation))).toEqual([])
  })

  it('says who asks wherever the accountId is data', () => {
    const silent = documents
      .filter(document => TARGET.includes(document.operation))
      .filter(document => !/\b(sub|account|about|orAccount):|\brequestFor\b/.test(document.call))
      .map(document => `${document.operation} (${document.file})`)
    expect(
      silent,
      `The accountId of these is data, and the request does not say who asks: ${silent.join(', ')}.\n` +
        'Pass a RequestFor on the request ({ sub }, { account } or { about: [...] }).'
    ).toEqual([])
  })
})

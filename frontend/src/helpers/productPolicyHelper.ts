import type { TFunction } from 'i18next'
import type { PreviewCount, PreviewSummary, ProductItem, ProductSync, SettingLock } from '../services/productPolicy'
import type { NetworkDeviceRole } from '../services/graphQLDeviceNetworks'

/* Product policy said in words (services/productPolicy): a product's sync level, an item its product gives a device
   and holds, and a preview of a change in brief. */

export const syncLabel = (t: TFunction, sync: ProductSync): string =>
  sync === 'enforced'
    ? t('productPolicy.enforced', 'Enforced')
    : sync === 'synced'
    ? t('productPolicy.synced', 'Synced')
    : t('productPolicy.template', 'Template')

export const syncMeaning = (t: TFunction, sync: ProductSync): string =>
  sync === 'enforced'
    ? t(
        'productPolicy.enforcedMeaning',
        'Its devices are exactly the product: its items are locked, and nothing else is kept.'
      )
    : sync === 'synced'
    ? t(
        'productPolicy.syncedMeaning',
        'Its items are locked on its devices and follow its changes; a device may add its own.'
      )
    : t(
        'productPolicy.templateMeaning',
        'Its items are copied to a device as it registers, then they are the device’s own.'
      )

// Whose an item is on a device: its product's, and how firmly.
export const managedBy = (t: TFunction, product: string, sync: ProductSync): string =>
  sync === 'enforced'
    ? t('productPolicy.managedEnforced', 'Managed by product {{product}} (enforced)', { product })
    : t('productPolicy.fromProduct', 'From product {{product}}', { product })

// A setting its product holds: under enforced the device is exactly the product, under synced it follows it.
export function productLockNote(t: TFunction, locked: SettingLock): string {
  if (!locked.product) return t('deviceSetting.productLocked', 'Set by its product')
  return locked.level === 'enforced'
    ? t('deviceSetting.productEnforced', 'Managed by product {{product}} (enforced)', { product: locked.product })
    : t('deviceSetting.productSynced', 'Set by its product {{product}}', { product: locked.product })
}

// The role a product's devices take on a network it grants.
export const roleName = (t: TFunction, role: NetworkDeviceRole) =>
  role === 'INITIATOR'
    ? t('productGrants.initiator', 'Initiator')
    : role === 'BOTH'
    ? t('productGrants.both', 'Initiator and target')
    : t('productGrants.target', 'Target')

// "3 tags", "1 network": a count of a kind of item, as graphql names the kind.
export function itemCount(t: TFunction, kind: string, count: number): string {
  switch (kind) {
    case 'tag':
      return t('productPolicy.tagCount', {
        count,
        defaultValue_one: '{{count}} tag',
        defaultValue_other: '{{count}} tags',
      })
    case 'network':
      return t('productPolicy.networkCount', {
        count,
        defaultValue_one: '{{count}} network',
        defaultValue_other: '{{count}} networks',
      })
    case 'service':
      return t('productPolicy.serviceCount', {
        count,
        defaultValue_one: '{{count}} service',
        defaultValue_other: '{{count}} services',
      })
    case 'setting':
      return t('productPolicy.settingCount', {
        count,
        defaultValue_one: '{{count}} setting',
        defaultValue_other: '{{count}} settings',
      })
    case 'proxy':
      return t('productPolicy.proxyCount', {
        count,
        defaultValue_one: '{{count}} proxy',
        defaultValue_other: '{{count}} proxies',
      })
    default:
      return t('productPolicy.itemCount', {
        count,
        defaultValue_one: '{{count}} item',
        defaultValue_other: '{{count}} items',
      })
  }
}

// An item named with its kind: "Tag: dev".
export function itemName(t: TFunction, item: ProductItem): string {
  switch (item.kind) {
    case 'tag':
      return t('productPolicy.tagItem', 'Tag {{name}}', { name: item.name })
    case 'network':
      return t('productPolicy.networkItem', 'Network {{name}}', { name: item.name })
    case 'service':
      return t('productPolicy.serviceItem', 'Service {{name}}', { name: item.name })
    case 'setting':
      return t('productPolicy.settingItem', 'Setting {{name}}', { name: item.name })
    case 'proxy':
      return t('productPolicy.proxyItem', 'Proxy {{name}}', { name: item.name })
    default:
      return item.name
  }
}

const devicesCount = (t: TFunction, count: number) =>
  t('productPolicy.deviceCount', {
    count,
    defaultValue_one: '{{count}} device',
    defaultValue_other: '{{count}} devices',
  })

/* A preview in brief, a line per kind: "37 devices will lose 12 tags". Losses first, as they are what is confirmed. */
export function summaryLines(t: TFunction, summary: PreviewSummary): { severity: 'warning' | 'info'; text: string }[] {
  const lines = (
    counts: PreviewCount[],
    say: (devices: string, items: string) => string,
    severity: 'warning' | 'info'
  ) =>
    counts.map(({ kind, devices, items }) => ({
      severity,
      text: say(devicesCount(t, devices), itemCount(t, kind, items)),
    }))
  return [
    ...lines(
      summary.removed,
      (devices, items) => t('productPolicy.willLose', '{{devices}} will lose {{items}}', { devices, items }),
      'warning'
    ),
    ...lines(
      summary.added,
      (devices, items) => t('productPolicy.willGet', '{{devices}} will get {{items}}', { devices, items }),
      'info'
    ),
    ...lines(
      summary.locked,
      (devices, items) =>
        t('productPolicy.willLock', '{{devices}} will have {{items}} locked to the product', { devices, items }),
      'info'
    ),
    ...lines(
      summary.owned,
      (devices, items) =>
        t('productPolicy.willOwn', '{{devices}} will keep {{items}} as their own', { devices, items }),
      'info'
    ),
  ]
}

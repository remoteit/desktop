/**
 * Static parent route map: [routePattern, parentPattern]
 *
 * Each entry maps a route to its semantic UP destination.
 * The first match wins, so order matters — place specific
 * patterns before general ones (e.g. /:id/edit before /:id).
 *
 * The parent is a UX decision, not a URL computation. This
 * lets UP skip intermediate routes the user never visits
 * (e.g. service sub-pages go directly to the device page).
 */
const ROUTE_PARENTS: [string, string][] = [
  // Devices — service sub-pages → device page (skip intermediate service level)
  ['/devices/:deviceID/:serviceID/connect', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/configure', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/edit', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/users/:userID', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/users', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/defaults', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/lan', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/advanced', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID/share', '/devices/:deviceID'],
  // Devices — device sub-pages → device page
  ['/devices/:deviceID/add/scan', '/devices/:deviceID'],
  ['/devices/:deviceID/add', '/devices/:deviceID'],
  ['/devices/:deviceID/users/:userID', '/devices/:deviceID'],
  ['/devices/:deviceID/share', '/devices/:deviceID'],
  ['/devices/:deviceID/edit', '/devices/:deviceID'],
  ['/devices/:deviceID/transfer', '/devices/:deviceID'],
  ['/devices/:deviceID/users', '/devices/:deviceID'],
  ['/devices/:deviceID/logs', '/devices/:deviceID'],
  ['/devices/:deviceID/details', '/devices/:deviceID'],
  ['/devices/:deviceID/:serviceID', '/devices/:deviceID'],
  // Devices — device page → devices list
  ['/devices/:deviceID', '/devices'],

  // Networks
  ['/networks/:networkID/:serviceID/lan', '/networks/:networkID'],
  ['/networks/:networkID/:serviceID', '/networks/:networkID'],
  ['/networks/:networkID/share', '/networks/:networkID'],
  ['/networks/:networkID/users', '/networks/:networkID'],
  ['/networks/:networkID', '/networks'],
  ['/networks/add', '/networks'],

  // Connections
  ['/connections/:serviceID/:sessionID/other', '/connections'],
  ['/connections/:serviceID/:sessionID', '/connections'],
  ['/connections/:serviceID', '/connections'],

  // Scripting — job device result → job detail
  ['/script/:fileID/:jobID/:jobDeviceID', '/script/:fileID/:jobID'],
  // Scripting — job-level pages → script page
  ['/script/:fileID/:jobID/run', '/script/:fileID'],
  ['/script/:fileID/:jobID', '/script/:fileID'],
  // Scripting — script sub-pages → script page
  ['/script/:fileID/edit', '/script/:fileID'],
  ['/script/:fileID/run', '/script/:fileID'],
  // Scripting — script page → scripts list
  ['/script/:fileID', '/scripts'],
  // Scripting — filtered runs list → runs list
  ['/runs/:fileID', '/runs'],
  // Scripting — file detail → files list
  ['/file/:fileID', '/files'],
  // Scripting — add pages
  ['/scripts/add/run', '/scripts'],
  ['/scripts/add', '/scripts'],
  ['/files/add', '/files'],

  // Products
  ['/products/:productId/add', '/products/:productId'],
  ['/products/:productId/transfer', '/products/:productId'],
  ['/products/:productId/details', '/products/:productId'],
  ['/products/:productId/:serviceId', '/products/:productId'],
  ['/products/:productId', '/products'],
  ['/products/add', '/products'],

  // Settings
  ['/settings/notifications', '/settings'],
  ['/settings/graphs', '/settings'],
  ['/settings/defaults/:applicationID', '/settings'],
  ['/settings/defaults', '/settings'],
  ['/settings/tags', '/settings'],
  ['/settings/test', '/settings'],
  ['/settings/options', '/settings'],

  // Organization
  ['/organization/roles/:roleID', '/organization/roles'],
  ['/organization/customer/add', '/organization'],
  ['/organization/customer/:userID/plans', '/organization/customer/:userID'],
  ['/organization/customer/:userID', '/organization'],
  ['/organization/customer', '/organization'],
  ['/organization/add', '/organization'],
  ['/organization/settings', '/organization'],
  ['/organization/licensing', '/organization'],
  ['/organization/tags', '/organization'],
  ['/organization/guests/:userID/:deviceID', '/organization/guests/:userID'],
  ['/organization/members/:userID/:deviceID', '/organization/members/:userID'],
  ['/organization/guests/:userID', '/organization'],
  ['/organization/members/:userID', '/organization'],
  ['/organization/account/:userID', '/organization'],
  ['/organization/guests', '/organization'],
  ['/organization/memberships', '/organization'],

  // Account
  ['/account/security', '/account'],
  ['/account/plans', '/account'],
  ['/account/billing', '/account'],
  ['/account/license', '/account'],
  ['/account/accessKey', '/account'],
  ['/account/overview', '/account'],

  // Admin
  ['/admin/users/:userId/account', '/admin/users/:userId'],
  ['/admin/users/:userId/devices', '/admin/users/:userId'],
  ['/admin/users/:userId', '/admin/users'],
  ['/admin/partners/:partnerId', '/admin/partners'],

  // Onboard
  ['/onboard/:platform/scanning', '/onboard/:platform'],
  ['/onboard/:platform/wifi', '/onboard/:platform'],
  ['/onboard/:platform/configuring', '/onboard/:platform'],
  ['/onboard/:platform', '/add'],

  // Add
  ['/add/raspberrypi-options', '/add'],
  ['/add/:platform/:redirect', '/add'],
  ['/add/:platform', '/add'],
]

export default ROUTE_PARENTS

import brand from '@common/brand/config'
import { CATALOGUE } from './platforms/catalogue'
const env = import.meta.env

export const MODE = env.MODE || 'development'

/* The license limit that gates the Remote.It AI chat. The whole surface hangs off this
   one name — the header button, the docked column and everything the panel loads — so
   switching the feature on for an account is a licensing change rather than a release:
   the ai-agent ADD-ON licence, granted per account from Admin → Add-ons (graphql-api
   docs/AI-AGENT-LICENSE.md). It is the ONLY switch. Until 2026-09-14 a dev build and the
   AI portal defaulted the flag on ahead of the licence (PENDING_FEATURES / CHAT_ALWAYS_ON);
   now an account without the licence — a developer's included — sees no chat anywhere. */
export const CHAT_FEATURE = 'ai-agent'

// Renderer-owned OIDC (permitteer docs/remoteit-desktop-login.md, D8) — identical on
// web and desktop; the backend never touches auth.
export const OAUTH_ISSUER = env.VITE_OAUTH_ISSUER || ''
export const OAUTH_CLIENT_ID = env.VITE_OAUTH_CLIENT_ID || 'remoteit_desktop'
export const OAUTH_ACCOUNT_RESOURCE = `${OAUTH_ISSUER}/account/api`
// The dev stage's UNIFIED FRONT (graphql-permitteer docs/CLOUD-EDGE.md). The identifier is the
// TREE, not the graphql URL: /api covers graphql, the user REST surface and the events socket, so
// one token serves all three. Was https://graphql.dev.remote.it/graphql until 2026-09-06, when
// that host was destroyed — a build falling back to the old default now asks for an audience whose
// resource server is being retired, and gets invalid_target.
export const OAUTH_GRAPHQL_RESOURCE = env.VITE_OAUTH_GRAPHQL_RESOURCE || 'https://cloud.remote.it/api'
// The two front shapes, recognised in ONE place (graphql-permitteer docs/CLOUD-EDGE.md): the unified
// front's TREE identifier, with graphql and the socket as paths inside it, and the legacy per-stage
// hosts, one each for graphql and events. Group 1 is the stage, absent on prod.
export const CLOUD_TREE_RE = /^https:\/\/cloud(?:\.([a-z0-9-]+))?\.remote\.it\/api$/
export const CLOUD_GRAPHQL_RE = /^(https:\/\/cloud(?:\.[a-z0-9-]+)?\.remote\.it\/api)\/graphql$/
export const LEGACY_GRAPHQL_RE = /^https:\/\/graphql(?:\.([a-z0-9-]+))?\.remote\.it\/graphql$/
export const LEGACY_EVENTS_RE = /^wss:\/\/ws(?:\.([a-z0-9-]+))?\.remote\.it\/v1$/
export const cloudTreeUrls = (tree: string) => ({
  graphql: `${tree}/graphql`,
  ws: `${tree.replace(/^https:/, 'wss:')}/ws`,
})
export const OAUTH_PASSPORT_RESOURCE = env.VITE_OAUTH_PASSPORT_RESOURCE || 'https://passport.dev.remote.it/account/api'
// The AI agent lane (permitteer docs/remoteit-ai-agent.md D1/D5): chat requests carry
// tokens ADDRESSED to the agent service, and the sign-in declares the stage's MCP detail
// delegated onward to the service actor — which is what makes those tokens exchangeable.
export const OAUTH_AGENT_RESOURCE = env.VITE_OAUTH_AGENT_RESOURCE || 'https://agent.remote.it'
export const OAUTH_MCP_RESOURCE = env.VITE_OAUTH_MCP_RESOURCE || 'https://cloud.remote.it/mcp'
// FALLBACK only: the live name is DISCOVERED from the MCP resource's PRM at sign-in
// (services/oidc.ts) — per-resource keying made it stage-stable, and the 2026-08-31
// retirement of the _dev names is exactly why a pinned copy can't be the source of truth.
export const OAUTH_MCP_DETAIL = env.VITE_OAUTH_MCP_DETAIL || 'remoteit_mcp'
export const OAUTH_AGENT_ACTOR = 'svc_ai_agent'
// Dev rides the vite /agent proxy (same-origin, CSP-clean) even when VITE_AGENT_URL is set;
// builds have no proxy and call the deployed agent.
export const AGENT_URL = env.DEV ? '/agent' : env.VITE_AGENT_URL || '/agent'

export const API_URL = env.VITE_API_URL || 'https://api.remote.it/apv/v27'
// The data plane defaults to the resource we mint for rather than to a fixed stage — otherwise an
// install that sets only the OIDC vars calls one stage with another stage's token and 401s with
// nothing in the UI explaining why. Set VITE_GRAPHQL_API (or pick a stage in Test Settings) to
// override.
//
// Two front shapes exist, and the audience means a different thing in each. On the legacy per-stage
// HOSTS the identifier IS the graphql URL (https://graphql.<stage>.remote.it/graphql). On the
// UNIFIED FRONT (graphql-permitteer docs/CLOUD-EDGE.md) one host carries every surface under PATH
// TREES, so the identifier is the TREE — https://cloud.<stage>.remote.it/api — and graphql and the
// socket are paths INSIDE it. Calling the audience directly there would POST queries at the tree
// root, so the tree has to be recognised and the leaf appended.
const cloudTree = CLOUD_TREE_RE.test(OAUTH_GRAPHQL_RESOURCE)
export const GRAPHQL_API =
  env.VITE_GRAPHQL_API || (cloudTree ? cloudTreeUrls(OAUTH_GRAPHQL_RESOURCE).graphql : OAUTH_GRAPHQL_RESOURCE)
export const GRAPHQL_BETA_API = env.VITE_GRAPHQL_BETA_API || 'https://api.remote.it/graphql/beta'
// Test Settings: an ad-hoc request header injected on API calls (helpers/apiHelper.getTestHeader).
export const TEST_HEADER = 'test-header'
export const PORTAL = (env.VITE_PORTAL || env.PORTAL) === 'true' ? true : false
export const PORTAL_URL = env.VITE_PORTAL_URL || brand.package?.homepage || 'https://app.remote.it'
export const DEVELOPER_KEY = env.VITE_DEVELOPER_KEY || 'Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3'

export const PROTOCOL = env.PROTOCOL || `${brand.name}://`

// Pairs with the GraphQL stage above, the same pairing Test Settings' stage picker applies:
// graphql.<stage>…/graphql <-> wss://ws.<stage>…/v1 on the legacy hosts, and the tree's own /ws
// path on the unified front. Previously these had NO fallback: dropping the env var left the
// socket URL undefined, which breaks the app before the UI that could fix it is reachable.
//
// The cloud branch is not a nicety. The legacy regex CANNOT match a tree identifier, and its miss
// falls through to the unlabelled `wss://ws.remote.it/v1` — PRODUCTION's socket. A dev build that
// merely stopped setting VITE_WEBSOCKET_URL would have connected there silently.
//
// Both shapes are read off the EFFECTIVE graphql URL, not off the OAuth resource: VITE_GRAPHQL_API
// may point at a legacy stage while the resource stays a cloud tree, and pairing the socket with
// the resource there would split API and event traffic across stages.
const graphqlTree = GRAPHQL_API.match(CLOUD_GRAPHQL_RE)?.[1]
const graphqlStage = GRAPHQL_API.match(LEGACY_GRAPHQL_RE)?.[1]
export const WEBSOCKET_URL =
  env.VITE_WEBSOCKET_URL ||
  (graphqlTree ? cloudTreeUrls(graphqlTree).ws : `wss://ws${graphqlStage ? `.${graphqlStage}` : ''}.remote.it/v1`)
export const WEBSOCKET_BETA_URL = env.VITE_WEBSOCKET_BETA_URL || WEBSOCKET_URL
export const PORT = env.VITE_PORT || 29999
export const PASSWORD_MIN_LENGTH = env.PASSWORD_MIN_LENGTH ? Number(env.PASSWORD_MIN_LENGTH) : 7
export const PASSWORD_MAX_LENGTH = env.PASSWORD_MAX_LENGTH ? Number(env.PASSWORD_MAX_LENGTH) : 64
export const RECAPTCHA_SITE_KEY = String(env.RECAPTCHA_SITE_KEY || '6Ldt3W4UAAAAAFtJAA4erruG9zT9TCOulJHO4L5e')

const BT_BASE_UUID = '-6802-4573-858e-5587180c32ea'
export const BT_UUIDS = {
  SERVICE: `0000a000${BT_BASE_UUID}`,
  WIFI_LIST: `0000a004${BT_BASE_UUID}`,
  WIFI_STATUS: `0000a001${BT_BASE_UUID}`,
  REGISTRATION_STATUS: `0000a011${BT_BASE_UUID}`,
  COMMAND: `0000a020${BT_BASE_UUID}`,
}

// Mirrors REGISTRATION_EXPIRATION in graphql-api/src/constants.ts (86400s) — keep in sync
export const REGISTRATION_CODE_EXPIRATION_HOURS = 24

export const DEMO_DEVICE_CLAIM_CODE = 'GUESTVPC'
export const DEMO_DEVICE_ID = '80:00:01:7F:7E:00:48:1B'

// When the guide bubble system shipped — bubbles are hidden from accounts created before their start date
export const GUIDE_START_DATE = new Date('2022-09-20')

//Airbrake
export const AIRBRAKE_ID = parseInt(env.VITE_AIRBRAKE_ID || '', 10)
export const AIRBRAKE_KEY = String(env.VITE_AIRBRAKE_KEY)

//API Zendesk
export const ZENDESK_URL = env.ZENDESK_URL || env.VITE_ZENDESK_URL
export const ZENDESK_KEY = env.ZENDESK_KEY || env.VITE_ZENDESK_KEY
//Analytics
export const GOOGLE_TAG_MANAGER_PORTAL_KEY = env.VITE_GOOGLE_TAG_MANAGER_PORTAL_KEY
export const GOOGLE_TAG_MANAGER_DESKTOP_KEY = env.VITE_GOOGLE_TAG_MANAGER_DESKTOP_KEY
export const GOOGLE_TAG_MANAGER_ANDROID_KEY = env.VITE_GOOGLE_TAG_MANAGER_ANDROID_KEY
export const GOOGLE_TAG_MANAGER_IOS_KEY = env.VITE_GOOGLE_TAG_MANAGER_IOS_KEY

export const CERTIFICATE_DOMAIN = 'at.remote.it'
export const ANONYMOUS_MANUFACTURER_CODE = 34560
// The catalogue owns this URL (android.link); the fallback only covers a stale snapshot.
export const SCREEN_VIEW_APP_LINK =
  CATALOGUE.installations.android?.link ?? 'https://play.google.com/store/apps/details?id=it.remote.screenview'

// Client capabilities, not catalogue data — see platforms/README.md.
export const OEM_GUIDE_LINK = 'https://link.remote.it/docs/oem-overview'
export const DEVICE_SETUP_PATH = '/devices/setup'
export const DEMO_SCRIPT_URL =
  'https://raw.githubusercontent.com/remoteit/code_samples/refs/heads/main/scripts/linux/script_demo.sh'

export const REGEX_LAST_PATH = /\/[^/]+$/g
export const REGEX_FIRST_PATH = /^\/([^\/]+)/g
export const REGEX_IP_SAFE = /[^0-9.]+/g
export const REGEX_PORT_SAFE = /[^0-9]+/g
export const REGEX_DOMAIN_SAFE = /[^a-zA-Z0-9-.]+/g
export const REGEX_EMAIL_SAFE = /[^a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+/g
export const REGEX_NUMERIC_VALUE = /=(\d+)/
export const REGEX_CHARACTERS = /^([^0-9]*)$/
export const REGEX_HIDDEN_PASSWORD = /^\*+$/
export const REGEX_URL_PATHNAME = /(\w*:\/\/)([^/]+\/)(.*)/
// export const REGEX_URL_PATHNAME = /\w*:\/\/[^/]*/
export const REGEX_VALID_IP =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/
export const REGEX_VALID_HOSTNAME =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/
export const REGEX_TAG_SAFE = /[\s]/g
export const REGEX_CONNECTION_NAME = /[^a-zA-Z0-9-]+/g
export const REGEX_CONNECTION_TRIM = /^-|-$/
export const REGEX_SERVICE_ID = /^..(:..){7}$/
export const REGEX_SCHEME = /^(.*?):\/\//

export const DESKTOP_EPOCH = new Date('2020-01-01T00:00:00')
export const MOBILE_LAUNCH_DATE = new Date('2023-12-20')
export const FRONTEND_RETRY_DELAY = 20000
// How long sign out waits for the local backend to come back before giving up and
// tearing down the frontend on its own. Short: it's a localhost socket.
export const SIGN_OUT_BACKEND_TIMEOUT = 3000
// How long "Sign out everywhere" waits for the AS to end every session before signing out
// locally regardless — a stalled token mint must never leave the person signed in here.
export const SIGN_OUT_EVERYWHERE_TIMEOUT = 10000
export const MAX_CONNECTION_NAME_LENGTH = 62
export const MAX_DESCRIPTION_LENGTH = 1024
export const SIDEBAR_WIDTH = 250
export const CHAT_PANEL_WIDTH = 400
export const CHAT_PANEL_WIDTH_MIN = 320
/* When the AI chat tour shipped. GuideBubble's `added` — a "dismiss all" from before
   this date does not suppress it, so users who opted out of the older guides still
   get introduced to a feature that did not exist back then. */
export const CHAT_GUIDE_DATE = new Date('2026-08-27')
/* Content that must survive beside a docked chat column. The column shrinks to
   preserve it, so the chat keeps its column on small desktop windows instead of
   taking the screen — that only happens at phone size (MOBILE_WIDTH). */
export const CHAT_MIN_CONTENT_WIDTH = 500
// Reading measure for the transcript column — text much wider than this is hard to
// track back to the start of the next line. Applied to the COLUMN, so the panel itself
// may be any width without the conversation spreading across it.
export const CHAT_MAX_MESSAGE_WIDTH = 800
/* Widest the column is worth dragging — the point at which the transcript stops growing,
   so past it the drag only buys empty panel around a column already at full width. Built
   from what actually stands between the two: the 20px gutter either side of the
   transcript (ChatMessages' paddingX) and the 8px the docked column insets itself by
   (ChatPanel's INSET). Derived rather than written down, because a round number here
   lands just short and the transcript never quite reaches its own measure. */
export const CHAT_PANEL_WIDTH_MAX = CHAT_MAX_MESSAGE_WIDTH + 20 * 2 + 8
export const ORGANIZATION_BAR_WIDTH = 70
export const HIDE_SIDEBAR_WIDTH = 1150
export const HIDE_TWO_PANEL_WIDTH = 750
export const SHOW_TRIPLE_PANEL_WIDTH = 1440
export const APP_MAX_WIDTH = 1800
export const MOBILE_WIDTH = 500
export const BINARY_DATA_TOKEN = '!BINARY-DATA'
export const VALID_JOB_ID_LENGTH = 36

export const LANGUAGES: ILookup<string> = {
  en: 'English',
  ja: 'Japanese',
}

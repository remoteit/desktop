// The auth (cognito) screens now share the app-wide i18next instance. Their
// strings live in the `cognito` namespace (frontend/src/i18n/locales/*/cognito.json).
// Kept as a re-export so existing imports (e.g. Wrapper.tsx) keep working.
import i18n from '../i18n'

export default i18n

import { isPortal } from '../services/Browser'
import { GOOGLE_TAG_MANAGER_DESKTOP_KEY, GOOGLE_TAG_MANAGER_PORTAL_KEY } from '../shared/constants'

export class AnalyticsHelper {
  key?: string

  constructor() {
    this.key = isPortal() ? GOOGLE_TAG_MANAGER_PORTAL_KEY : GOOGLE_TAG_MANAGER_DESKTOP_KEY
  }

  setup() {
    const headScript = document.createElement('script')
    headScript.text = `
      <!-- Google Tag Manager -->
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${this.key}');</script>
      <!-- End Google Tag Manager -->`

    const bodyScript = document.createElement('script')
    bodyScript.text = `
      <!-- Google Tag Manager (noscript) -->
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${this.key}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
      <!-- End Google Tag Manager (noscript) -->`

    const head = document.getElementsByTagName('head')[0]
    head.insertBefore(headScript, head.firstChild)

    const body = document.getElementsByTagName('body')[0]
    body.insertBefore(bodyScript, body.firstChild)
  }
}

export default new AnalyticsHelper()

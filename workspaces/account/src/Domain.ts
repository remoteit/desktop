export default class Domain {
  /**
   * Assume anyone with a custom domain is a pre-paid commercial
   * account except app. for production. staging.remote.it and
   * latest.remote.it will also be treated the same as s.
   * */
  static get isEnterprise(): boolean {
    const hostName = window.location.hostname
    const subdomain = hostName.split('.')[0]

    const nonCommercialSubdomains = [
      'localhost',
      'app',
      'beta',
      'staging',
      'latest'
    ]
    if (
      nonCommercialSubdomains.includes(subdomain) ||
      hostName.includes('herokuapp.com') || 
      hostName.includes('vpi.io')
    ) {
      return false
    }

    return true
  }
}

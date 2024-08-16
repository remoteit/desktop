import { graphQLBasicRequest } from './graphQL'

export async function graphQLLogin() {
  return await graphQLBasicRequest(
    ` query Auth {
        login {
          id
          email
          authhash
          yoicsId
        }
      }`
  )
}

export async function graphQLFiles(accountId: string) {
  return await graphQLBasicRequest(
    ` query Files($accountId: String) {
        login {
          account(id: $accountId) {
            files {
                id
                name
                created
                updated
                shortDesc
                longDesc
                executable
                versions(latest: true) {
                  items {
                    id
                    platform {
                      id
                    } 
                    arguments {
                      name
                      desc
                      order
                      argumentType
                      options
                    }
                  }
                }
              }
            }
          }
      }`,
    { accountId }
  )
}

export async function graphQLUser(accountId: string) {
  return await graphQLBasicRequest(
    ` query User($accountId: String) {
        login {
          account(id: $accountId) {
            id
            email
            language
            created
            reseller {
              name
              email
              logoUrl
            }
            notificationSettings {
              emailNotifications
              desktopNotifications
              urlNotifications
              notificationEmail
              notificationUrl
            }
            attributes
          }
        }
      }`,
    { accountId }
  )
}

export async function graphQLRegistration(props: {
  name?: string
  tags?: string[]
  platform?: number
  services: IServiceRegistration[]
  accountId: string
}) {
  return await graphQLBasicRequest(
    ` query Registration($accountId: String, $name: String, $platform: Int, $tags: [String!], $services: [ServiceInput!]) {
        login {
          account(id: $accountId) {
            registrationCode(name: $name, platform: $platform, tags: $tags, services: $services)
            registrationCommand(name: $name, platform: $platform, tags: $tags, services: $services)
          }
        }
      }`,
    props
  )
}

export async function graphQLRestoreDevice(props: { id: string; accountId: string }) {
  return await graphQLBasicRequest(
    ` query Restore($id: [String!]!, $accountId: String) {
        login {
          account(id: $accountId) {
            device(id: $id)  {
              restoreCommand
              restoreCode
            }
          }
        }
      }`,
    props
  )
}

export async function graphQLPreloadNetworks(accountId: string) {
  return await graphQLBasicRequest(
    ` query Networks($accountId: String) {
      login {
        account(id: $accountId) {
          networks {
            id
            name
            created
            permissions
            owner {
              id
              email
            }
            connections {
              service {
                id
                device {
                  id
                }          
              }
              name
              port
            }
            tags {
              name
              color
              created
            }
            access {
              user {
                id
                email
              }
            }
          }
        }
      }
    }`,
    { accountId }
  )
}

/* 
  Fetches single network across shared accounts by id
*/
export async function graphQLFetchNetworkSingle(id: string) {
  return await graphQLBasicRequest(
    ` query NetworkServices($id: String!) {
        login {
          network(id: $id)  {
            connections {
              service {
                id
                device {
                  id
                }
              }
            }
          }
        }
      }`,
    { id }
  )
}

const LICENSES_QUERY = `
  id
  updated
  created
  expiration
  valid
  quantity
  custom
  plan {
    id
    name
    description
    commercial
    billing
    product {
      id
      name
      description
    }
  }
  subscription {
    total
    status
    price {
      id
      amount
      currency
      interval
    }
    card {
      brand
      month
      year
      last
      name
      email
      phone
      postal
      country
      expiration
    }
  }`

const PLANS_QUERY = `
  id
  name
  description
  product {
    id
  }
  prices {
    id
    amount
    currency
    interval
  }
  limits {
    name
    value
    scale
  }`

const LIMITS_QUERY = `
  name
  value
  actual
  base
  scale
  license {
    id
  }`

export async function graphQLFetchPlans() {
  return await graphQLBasicRequest(
    ` query Plans {
        plans {
          ${PLANS_QUERY}
        }
      }`
  )
}

export async function graphQLFetchOrganizations(ids: string[]) {
  return await graphQLBasicRequest(
    ` query Organizations {
        login {
          ${ids
            .map(
              (id, index) => `
            _${index}: account(id: "${id}") {
              organization {
                id
                name
                domain
                created
                verified
                verificationCNAME
                verificationValue
                roles {
                  id
                  name
                  system
                  permissions
                  access
                  tag {
                    operator
                    values
                  }
                }
                members {
                  created
                  customRole {
                    id
                    name
                  }
                  license
                  user {
                    id
                    email
                  }
                }
                reseller {
                  name
                  email
                  logoUrl
                  plans {
                    ${PLANS_QUERY}
                  }
                  licenses {
                    user {
                      id
                      email
                      created
                      limits {
                        ${LIMITS_QUERY}
                      }
                      reseller {
                        email
                      }
                    }
                    ${LICENSES_QUERY}
                  }
                }
                providers
                identityProvider {
                  type
                  clientId
                  issuer
                }
              }
              licenses {
                ${LICENSES_QUERY}
              }
              limits {
                ${LIMITS_QUERY}
              }
            }`
            )
            .join('\n')}
        }
      }`
  )
}

export async function graphQLFetchGuests(accountId: string) {
  return await graphQLBasicRequest(
    ` query Guests($accountId: String) {
        login {
          account(id: $accountId) {
            guest {
              user {
                id
                email
              }
              devices {
                id
              }
              networks {
                id
              }
            }
          }
        }
      }`,
    { accountId }
  )
}

export async function graphQLFetchSessions(ids: string[]) {
  return await graphQLBasicRequest(
    ` query Sessions {
        login {
          ${ids
            .map(
              (id, index) => `
            _${index}: account(id: "${id}") {
              sessions {
                id
                timestamp
                source
                endpoint {
                  proxy
                  platform
                  manufacturer
                  geo {
                    city
                    stateName
                    countryName
                  }
                }
                user {
                  id
                  email
                }
                target {
                  id
                  name
                  platform
                  application
                  owner {
                    id
                  }
                  device {
                    id
                    name
                  }
                }
              }
            }`
            )
            .join('\n')}
        }
      }`
  )
}

export async function graphQLGetResellerReportUrl(accountId: string) {
  return await graphQLBasicRequest(
    ` query ResellerReportUrl($accountId: String)  {
        login {
          account(id: $accountId) {
            organization {
              reseller {
                reportUrl
              }
            }
          }
        }
      }`,
    { accountId }
  )
}

import { graphQLBasicRequest } from './graphQL'

export async function graphQLLogin() {
  return await graphQLBasicRequest(
    ` query Auth {
        login {
          id
          email
          authhash
          yoicsId
          admin
        }
      }`
  )
}

export async function graphQLFiles(accountId: string, ids?: string[]) {
  return await graphQLBasicRequest(
    ` query Files($accountId: String, $ids: [ID!]) {
        login {
          account(id: $accountId) {
            files(ids: $ids) {
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
    { accountId, ids }
  )
}

export async function graphQLJobs(accountId: string, fileIds?: string[], ids?: string[]) {
  return await graphQLBasicRequest(
    ` query Jobs($accountId: String, $ids: [ID!], $fileIds: [ID!]) {
        login {
          account(id: $accountId) {
            jobs(ids: $ids, fileIds: $fileIds, size: 50) {
              items {
                id
                status
                created
                updated
                owner {
                  id
                  email
                }
                user {
                  id
                  email
                }
                tag {
                  operator
                  values
                }
                file {
                  id
                  name
                }
                jobDevices {
                  id
                  status
                  created
                  updated
                  attributes {
                    key
                    value
                  }
                  device {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }`,
    { accountId, fileIds, ids }
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
            info {
              devices {
                total
                online
                offline
              }
            }
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

export async function graphQLAdminUsers(
  options: { from?: number; size?: number },
  filters?: { search?: string; email?: string; accountId?: string },
  sort?: string
) {
  return await graphQLBasicRequest(
    ` query AdminUsers($from: Int, $size: Int, $search: String, $email: String, $accountId: String, $sort: String) {
        admin {
          users(from: $from, size: $size, search: $search, email: $email, accountId: $accountId, sort: $sort) {
            items {
              id
              email
              created
              info {
                devices {
                  total
                }
              }
            }
            total
            hasMore
          }
        }
      }`,
    {
      from: options.from,
      size: options.size,
      search: filters?.search,
      email: filters?.email,
      accountId: filters?.accountId,
      sort,
    }
  )
}

export async function graphQLAdminUser(accountId: string) {
  return await graphQLBasicRequest(
    ` query AdminUser($accountId: String) {
        admin {
          users(from: 0, size: 1, accountId: $accountId) {
            items {
              id
              email
              created
              lastLogin
              info {
                devices {
                  total
                  online
                  offline
                }
              }
              organization {
                name
              }
            }
            total
            hasMore
          }
        }
      }`,
    { accountId }
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

export async function graphQLAdminUserDevices(
  accountId: string,
  options: { from?: number; size?: number } = {}
) {
  return await graphQLBasicRequest(
    ` query AdminUserDevices($accountId: String!, $from: Int, $size: Int) {
        login {
          account(id: $accountId) {
            devices(from: $from, size: $size) {
              total
              items {
                id
                name
                state
                platform
                license
                lastReported
                created
                endpoint {
                  externalAddress
                }
                owner {
                  id
                  email
                }
                services {
                  id
                  name
                  state
                }
              }
            }
          }
        }
      }`,
    { accountId, from: options.from || 0, size: options.size || 100 }
  )
}

export async function graphQLAdminPartners() {
  return await graphQLBasicRequest(
    ` query AdminPartners {
        admin {
          partners {
            id
            name
            parent {
              id
              name
              deviceCount
              online
              active
              activated
            }
            deviceCount
            online
            active
            activated
            updated
          }
        }
      }`
  )
}

export async function graphQLAdminPartner(id: string) {
  return await graphQLBasicRequest(
    ` query AdminPartner($id: String!) {
        admin {
          partners(id: $id) {
            id
            name
            parent {
              id
              name
              deviceCount
              online
              active
              activated
            }
            deviceCount
            online
            active
            activated
            updated
            users {
              id
              email
              role
              deviceCount
              online
              active
              activated
              updated
            }
            children {
              id
              name
              deviceCount
              online
              active
              activated
            }
          }
        }
      }`,
    { id }
  )
}

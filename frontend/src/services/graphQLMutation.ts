import { graphQLBasicRequest } from './graphQL'
import { addConnectionProps } from '../models/networks'

export async function graphQLSetAttributes(attributes: ILookup<string | number | undefined>, serviceId?: String) {
  return await graphQLBasicRequest(
    ` mutation SetAttributes($attributes: Object!, $serviceId: String) {
        setAttributes(attributes: $attributes, serviceId: $serviceId)
      }`,
    { attributes: { $remoteit: attributes }, serviceId }
  )
}

export async function graphQLSetDeviceNotification(
  deviceID: string,
  emailNotifications?: boolean | null,
  desktopNotifications?: boolean | null
) {
  return await graphQLBasicRequest(
    ` mutation SetDeviceNotification($deviceID: String!, $emailNotifications: Boolean, $desktopNotifications: Boolean ){
        setNotificationSettings(
          serviceId: $deviceID, 
          emailNotifications: $emailNotifications, 
          desktopNotifications: $desktopNotifications
        )
      }
    `,
    { emailNotifications, desktopNotifications, deviceID }
  )
}

export async function graphQLConnect(serviceId: string, hostIP?: string) {
  return await graphQLBasicRequest(
    ` mutation Connect($serviceId: String!, $hostIP: String) {
        connect(serviceId: $serviceId, hostIP: $hostIP) {
          id
          created
          host
          port
          reverseProxy
          timeout
        }
      }`,
    { serviceId, hostIP }
  )
}

export async function graphQLDisconnect(serviceId: string, connectionId: string) {
  return await graphQLBasicRequest(
    ` mutation Disconnect($serviceId: String!, $connectionId: String!) {
        disconnect(serviceId: $serviceId, connectionId: $connectionId)
      }`,
    { serviceId, connectionId }
  )
}

export async function graphQLSurvey(serviceId: string, sessionId: string, quality: number) {
  return await graphQLBasicRequest(
    ` mutation Survey($serviceId: String!, $sessionId: String!, $quality: Int!) {
        rateConnection(serviceId: $serviceId, sessionId: $sessionId, quality: $quality)
      }`,
    { serviceId, sessionId, quality }
  )
}

export async function graphQLSetConnectLink(params: {
  serviceId: string
  password?: string | null
  enabled?: boolean
}) {
  return await graphQLBasicRequest(
    ` mutation SetLink($serviceId: String!, $password: String, $enabled: Boolean) {
        setConnectLink(serviceId: $serviceId, password: $password, enabled: $enabled) {
          url
          password
          enabled
          created
        }
      }`,
    params
  )
}

export async function graphQLRemoveConnectLink(serviceId: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveLink($serviceId: String!) {
        removeConnectLink(serviceId: $serviceId)
      }`,
    { serviceId }
  )
}

export async function graphQLRegistration(props: {
  name?: string
  services: IServiceRegistration[]
  platform?: number
  account: string
}) {
  return await graphQLBasicRequest(
    ` query Registration($account: String, $name: String, $platform: Int, $services: [ServiceInput!]) {
        login {
          account(id: $account) {
            registrationCode(name: $name, platform: $platform, services: $services)
            registrationCommand(name: $name, platform: $platform, services: $services)
          }
        }
      }`,
    props
  )
}

export async function graphQLRename(serviceId: string, name: string) {
  return await graphQLBasicRequest(
    ` mutation Rename($serviceId: String!, $name: String!) {
        renameService(serviceId: $serviceId, name: $name)
      }`,
    { serviceId, name }
  )
}

export async function graphQLDeleteDevice(deviceId: string) {
  return await graphQLBasicRequest(
    ` mutation Delete($deviceId: String!) {
        deleteDevice(deviceId: $deviceId)
      }`,
    { deviceId }
  )
}

export async function graphQLUnShareDevice(params: IShareProps) {
  return await graphQLBasicRequest(
    ` mutation UnShare($deviceId: String!, $email: [String!]!) {
        share(deviceId: $deviceId, email: $email, action: REMOVE)
      }`,
    params
  )
}

export async function graphQLShareDevice(params: IShareProps) {
  return await graphQLBasicRequest(
    ` mutation Share($deviceId: String!, $email: [String!]!, $scripting: Boolean, $services: [ServiceSharingOptions!]) {
        share(
          deviceId: $deviceId, 
          email: $email, 
          scripting: $scripting,
          services: $services
        )
      }`,
    params
  )
}

export async function graphQLSetOrganization(params: IOrganizationSettings) {
  return await graphQLBasicRequest(
    ` mutation SetOrganization($accountId: String, $name: String, $domain: String, $providers: [AuthenticationProvider!]) {
        setOrganization(accountId: $accountId, name: $name, domain: $domain, providers: $providers)
      }`,
    params
  )
}

export async function graphQLSetSAML(params: { accountId: string; enabled: boolean; metadata?: string }) {
  return await graphQLBasicRequest(
    ` mutation SetSAML($accountId: String, $enabled: Boolean, $metadata: String) {
        configureSAML(accountId: $accountId, enabled: $enabled, metadata: $metadata)
      }`,
    params
  )
}

export async function graphQLRemoveOrganization() {
  return await graphQLBasicRequest(
    ` mutation {
        deleteOrganization
      }`
  )
}

export async function graphQLSetMembers(
  email: string[],
  accountId?: string,
  roleId?: IOrganizationRoleIdType,
  license?: ILicenseTypes
) {
  return await graphQLBasicRequest(
    ` mutation SetMember($accountId: String, $email: [String!]!, $roleId: ID, $license: LicenseOption) {
        setMember(accountId: $accountId, email: $email, roleId: $roleId, license: $license)
      }`,
    { accountId, email, roleId, license }
  )
}

export async function graphQLRemoveMembers(email: string[], accountId?: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveMembers($accountId: String, $email: [String!]!) {
        removeMember(accountId: $accountId, email: $email)
      }`,
    { accountId, email }
  )
}

export async function graphQLLeaveMembership(id: string) {
  return await graphQLBasicRequest(
    ` mutation LeaveMembership($id: ID!) {
        leaveOrganization(id: $id)
      }`,
    { id }
  )
}

export async function graphQLClaimDevice(code: string, accountId?: string) {
  return await graphQLBasicRequest(
    ` mutation Claim($code: String!, $accountId: String) {
        claimDevice(code: $code, accountId: $accountId) {
          id
          name
        }
      }`,
    { code, accountId }
  )
}

export async function graphQLConfigureSAML(params: { enabled: boolean; metadata: string }) {
  return await graphQLBasicRequest(
    ` mutation SAML($enabled: Boolean!, $metadata: String!)) {
        configureSAML(enabled: $enabled, metadata: $metadata)
      }`,
    params
  )
}

export async function graphQLSubscribe(params: IPurchase) {
  return await graphQLBasicRequest(
    ` mutation Subscribe($priceId: String!, $quantity: Int, $successUrl: String!, $cancelUrl: String!) {
        createSubscription(priceId: $priceId, quantity: $quantity, successUrl: $successUrl, cancelUrl: $cancelUrl) {
          url
        }
      }`,
    {
      ...params,
      successUrl: window.location.href + '/success',
      cancelUrl: window.location.href,
    }
  )
}

export async function graphQLCreditCard() {
  return await graphQLBasicRequest(
    ` mutation UpdateCreditCard($successUrl: String!, $cancelUrl: String!) {
        updateCreditCard(successUrl: $successUrl, cancelUrl: $cancelUrl) {
          url
        }
      }`,
    {
      successUrl: window.location.href + '/success',
      cancelUrl: window.location.href,
    }
  )
}

export async function graphQLUpdateSubscription(params: { priceId: string; quantity: number; accountId: string }) {
  return await graphQLBasicRequest(
    ` mutation UpdateSubscription($priceId: String!, $quantity: Int, $accountId: String!) {
        updateSubscription(priceId: $priceId, quantity: $quantity, accountId: $accountId)
      }`,
    params
  )
}

export async function graphQLUnsubscribe() {
  return await graphQLBasicRequest(
    ` mutation {
        cancelSubscription
      }`
  )
}

export async function graphQLAddService(form: ICloudAddService) {
  return await graphQLBasicRequest(
    ` mutation AddService($deviceId: String!, $name: String, $application: Int, $host: String, $port: Int, $enabled: Boolean) {
        addService(
          deviceId: $deviceId,
          name: $name,
          application: $application,
          host: $host,
          port: $port,
          enabled: $enabled,
        ) {
          id
        }
      }`,
    form
  )
}

export async function graphQLUpdateService(form: ICloudUpdateService) {
  return await graphQLBasicRequest(
    ` mutation UpdateService($id: ID!, $name: String, $application: Int, $host: String, $port: Int, $enabled: Boolean, $presenceAddress: String) {
        updateService(
          id: $id,
          name: $name,
          application: $application,
          host: $host,
          port: $port,
          enabled: $enabled,
          presenceAddress: $presenceAddress
        ) {
          id
        }
      }`,
    form
  )
}

export async function graphQLRemoveService(id: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveService($id: ID!) {
        removeService(id: $id)
      }`,
    { id }
  )
}

export async function graphQLReadNotice(id: string) {
  return await graphQLBasicRequest(
    ` mutation ReadNotice($id: String!) {
        readNotice(id: $id)
      }`,
    { id }
  )
}

export async function graphQLCreateRole(params: ICreateRole) {
  return await graphQLBasicRequest(
    ` mutation CreateRole($name: String, $grant: [RolePermission!], $revoke: [RolePermission!], $tag: ListFilter, $accountId: String) {
        createRole(name: $name, grant: $grant, revoke: $revoke, tag: $tag, accountId: $accountId) {
          id
        }
      }`,
    params
  )
}

export async function graphQLUpdateRole(params: ICreateRole) {
  return await graphQLBasicRequest(
    ` mutation UpdateRole($id: String!, $name: String, $grant: [RolePermission!], $revoke: [RolePermission!], $tag: ListFilter, $access: CustomRoleAccess, $accountId: String) {
        updateRole(id: $id, name: $name, grant: $grant, revoke: $revoke, tag: $tag, access: $access, accountId: $accountId) {
          id
        }
      }`,
    params
  )
}

export async function graphQLRemoveRole(id: string, accountId: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveRole($id: String!, $accountId: String) {
        deleteRole(id: $id, accountId: $accountId)
      }`,
    { id, accountId }
  )
}

export async function graphQLSetTag(tag: { name: string; color: number }, accountId: string) {
  return await graphQLBasicRequest(
    ` mutation SetTag($tag: [TagInput!]!, $accountId: String) {
        setTag(tag: $tag, accountId: $accountId)
      }`,
    { tag, accountId }
  )
}

export async function graphQLAddDeviceTag(serviceId: string | string[], name: string | string[], accountId: string) {
  return await graphQLBasicRequest(
    ` mutation AddTag($serviceId: [String!]!, $name: [String!]!, $accountId: String) {
        addTag(serviceId: $serviceId, name: $name, accountId: $accountId)
    }`,
    { serviceId, name, accountId }
  )
}

export async function graphQLAddNetworkTag(networkId: string, name: string | string[]) {
  return await graphQLBasicRequest(
    ` mutation AddNetworkTag($networkId: String!, $name: [String!]!) {
        addNetworkTag(networkId: $networkId, name: $name)
    }`,
    { networkId, name }
  )
}

export async function graphQLRemoveDeviceTag(serviceId: string | string[], name: string, accountId: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveTag($serviceId: [String!]!, $name: [String!]!, $accountId: String) {
        removeTag(serviceId: $serviceId, name: $name, accountId: $accountId)
    }`,
    { serviceId, name, accountId }
  )
}

export async function graphQLRemoveNetworkTag(networkId: string | string[], name: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveNetworkTag($networkId: String!, $name: [String!]!) {
        removeNetworkTag(networkId: $networkId, name: $name)
    }`,
    { networkId, name }
  )
}

export async function graphQLRenameTag(from: string, to: string, accountId: string) {
  return await graphQLBasicRequest(
    ` mutation RenameTag($from: String!, $to: String!, $accountId: String) {
        renameTag(from: $from, to: $to, accountId: $accountId)
    }`,
    { from, to, accountId }
  )
}

export async function graphQLMergeTag(from: string, to: string, accountId: string) {
  return await graphQLBasicRequest(
    ` mutation MergeTag($from: String!, $to: String!, $accountId: String) {
        mergeTag(from: $from, to: $to, accountId: $accountId)
    }`,
    { from, to, accountId }
  )
}

export async function graphQLDeleteTag(name: string, accountId: string) {
  return await graphQLBasicRequest(
    ` mutation DeleteTag($name: [String!]!, $accountId: String) {
        deleteTag(name: $name, accountId: $accountId)
      }`,
    { name, accountId }
  )
}

export async function graphQLNotificationSettings(params: INotificationSetting) {
  return await graphQLBasicRequest(
    ` mutation NotificationSettings($emailNotifications: Boolean, $desktopNotifications: Boolean, $urlNotifications: Boolean, $notificationUrl: String) {
        setNotificationSettings(
          emailNotifications: $emailNotifications, 
          desktopNotifications: $desktopNotifications, 
          urlNotifications: $urlNotifications, 
          notificationUrl: $notificationUrl
        )
      }`,
    params
  )
}

export async function graphQLTransferDevice(params: ITransferProps) {
  return await graphQLBasicRequest(
    ` mutation TransferDevice($deviceId: String!, $email: String!) {
        transfer(
            deviceId: $deviceId, 
            email: $email
          )
        }`,
    {
      deviceId: params.device?.id,
      email: params.email,
    }
  )
}

export async function graphQLUpdateNetwork(params: INetwork) {
  return await graphQLBasicRequest(
    ` mutation UpdateNetwork($id: String!, $name: String) {
        updateNetwork(id: $id, name: $name) {
          id
        }
      }`,
    params
  )
}

export async function graphQLAddNetwork(name: string, accountId: string) {
  return await graphQLBasicRequest(
    ` mutation CreateNetwork($accountId: String, $name: String) {
        createNetwork(accountId: $accountId, name: $name) {
          id
        }
      }`,
    {
      name,
      accountId,
    }
  )
}

export async function graphQLDeleteNetwork(networkId: string) {
  return await graphQLBasicRequest(
    ` mutation DeleteNetwork($networkId: String!) {
        deleteNetwork(id: $networkId) 
      }`,
    {
      networkId,
    }
  )
}

export async function graphQLSetConnection(props: addConnectionProps) {
  return await graphQLBasicRequest(
    ` mutation SetConnection(
        $networkId: String!,
        $serviceId: String!,
        $port: Int,
        $name: String,
      ) {
        addNetworkConnection(networkId: $networkId, serviceId: $serviceId, port: $port, name: $name)
      }`,
    props
  )
}

export async function graphQLRemoveConnection(networkId: string, serviceId: string) {
  return await graphQLBasicRequest(
    ` mutation RemoveConnection($networkId: String!, $serviceId: String!) {
        removeNetworkConnection(networkId: $networkId, serviceId: $serviceId)
      }`,
    { networkId, serviceId }
  )
}

export async function graphQLAddNetworkShare(networkId: string, email: string[] | string) {
  return await graphQLBasicRequest(
    ` mutation AddNetworkShare($networkId: String!, $email: [String!]!) {
        addNetworkShare(networkId: $networkId, email: $email)
      }`,
    { networkId, email }
  )
}

export async function graphQLRemoveNetworkShare(networkId: string, email: string[] | string) {
  return await graphQLBasicRequest(
    ` mutation RemoveNetworkShare($networkId: String!, $email: [String!]!) {
        removeNetworkShare(networkId: $networkId, email: $email)
      }`,
    { networkId, email }
  )
}

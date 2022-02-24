import { graphQLBasicRequest } from './graphQL'

export async function graphQLSetAttributes(attributes: ILookup<string | number | undefined>, serviceId: String) {
  return await graphQLBasicRequest(
    ` mutation query($attributes: Object!, $serviceId: String) {
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
    `
      mutation query($deviceID: String!, $emailNotifications: Boolean, $desktopNotifications: Boolean ){
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
    ` mutation query($serviceId: String!, $hostIP: String) {
        connect(serviceId: $serviceId, hostIP: $hostIP) {
          id
          created
          host
          port
          reverseProxy
          timeout
          session {
            id
          }
        }
      }`,
    { serviceId, hostIP }
  )
}

export async function graphQLDisconnect(serviceId: string, connectionId: string) {
  return await graphQLBasicRequest(
    ` mutation query($serviceId: String!, $connectionId: String!) {
        disconnect(serviceId: $serviceId, connectionId: $connectionId)
      }`,
    { serviceId, connectionId }
  )
}

export async function graphQLRename(serviceId: string, name: string) {
  return await graphQLBasicRequest(
    ` mutation query($serviceId: String!, $name: String!) {
        renameService(serviceId: $serviceId, name: $name)
      }`,
    { serviceId, name }
  )
}

export async function graphQLDeleteDevice(deviceId: string) {
  return await graphQLBasicRequest(
    ` mutation query($deviceId: String!) {
        deleteDevice(deviceId: $deviceId)
      }`,
    { deviceId }
  )
}

export async function graphQLRemoveDevice(params: IShareProps) {
  return await graphQLBasicRequest(
    ` mutation query($deviceId: String!, $email: [String!]!) {
        share(deviceId: $deviceId, email: $email, action: REMOVE)
      }`,
    params
  )
}

export async function graphQLShareDevice(params: IShareProps) {
  return await graphQLBasicRequest(
    ` mutation query($deviceId: String!, $email: [String!]!, $scripting: Boolean, $services: [ServiceSharingOptions!]) {
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

export async function graphQLSetOrganization(name: string) {
  return await graphQLBasicRequest(
    ` mutation query($name: String!) {
        setOrganization(name: $name)
      }`,
    { name }
  )
}

export async function graphQLRemoveOrganization() {
  return await graphQLBasicRequest(
    ` mutation {
        deleteOrganization
      }`
  )
}

export async function graphQLSetMembers(email: string[], role: IOrganizationRole, license?: ILicenseTypes) {
  return await graphQLBasicRequest(
    ` mutation query($email: [String!]!, $role: OrganizationRole, $license: LicenseOption) {
        setMember(email: $email, role: $role, license: $license)
      }`,
    { email, role, license }
  )
}

export async function graphQLLeaveMembership(id: string) {
  return await graphQLBasicRequest(
    ` mutation query($id: ID!) {
        leaveOrganization(id: $id)
      }`,
    { id }
  )
}

export async function graphQLClaimDevice(code: string) {
  return await graphQLBasicRequest(
    ` mutation query($code: String!) {
        claimDevice(code: $code) {
          id
          name
        }
      }`,
    { code }
  )
}

export async function graphQLSubscribe(params: IPurchase) {
  return await graphQLBasicRequest(
    ` mutation query($priceId: String!, $quantity: Int, $successUrl: String!, $cancelUrl: String!) {
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
    ` mutation query($successUrl: String!, $cancelUrl: String!) {
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

export async function graphQLUpdateSubscription(params: { priceId: string; quantity: number }) {
  return await graphQLBasicRequest(
    ` mutation query($priceId: String!, $quantity: Int) {
        updateSubscription(priceId: $priceId, quantity: $quantity)
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
    ` mutation query($deviceId: String!, $name: String, $application: Int, $host: String, $port: Int, $enabled: Boolean) {
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
    ` mutation query($id: ID!, $name: String, $application: Int, $host: String, $port: Int, $enabled: Boolean) {
        updateService(
          id: $id,
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

export async function graphQLRemoveService(id: string) {
  return await graphQLBasicRequest(
    ` mutation query($id: ID!) {
        removeService(id: $id)
      }`,
    { id }
  )
}

export async function graphQLReadNotice(id: string) {
  return await graphQLBasicRequest(
    ` mutation query($id: String!) {
        readNotice(id: $id)
      }`,
    { id }
  )
}

export async function graphQLCreateTag(tag: { name: string; color: number }) {
  return await graphQLBasicRequest(
    ` mutation query($tag: [TagInput!]!) {
        createTag(tag: $tag)
      }`,
    { tag }
  )
}

export async function graphQLAddTag(serviceId: string, name: string) {
  return await graphQLBasicRequest(
    ` mutation query($serviceId: [String!]!, $name: [String!]!) {
        addTag(serviceId: $serviceId, name: $name)
    }`,
    { serviceId, name }
  )
}

export async function graphQLRenameTag(from: string, to: string) {
  return await graphQLBasicRequest(
    ` mutation query($from: String!, $to: String!) {
        renameTag(from: $from, to: $to)
    }`,
    { from, to }
  )
}

export async function graphQLRemoveTag(name: string) {
  return await graphQLBasicRequest(
    ` mutation query($name: [String!]!) {
        deleteTag(name: $name)
      }`,
    { name }
  )
}

export async function graphQLUpdateNotification(params: INotificationSetting) {
  return await graphQLBasicRequest(
    `  mutation UpdateUserMetadata(
          $emailNotifications: Boolean
          $desktopNotifications: Boolean
          $urlNotifications: Boolean
          $notificationUrl: String
        ) {
          setNotificationSettings(
            emailNotifications: $emailNotifications, 
            desktopNotifications: $desktopNotifications, 
            urlNotifications: $urlNotifications, 
            notificationUrl: $notificationUrl
          )
        }
      `,
    params
  )
}

export async function graphQLTransferDevice(params: ITransferProps) {
  return await graphQLBasicRequest(
    ` mutation query($deviceId: String!, $email: String!) {
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

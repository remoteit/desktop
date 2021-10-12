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

export async function graphQLUnShareDevice(params: IShareProps) {
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

export async function graphQLLinkAccount(emails: string[], action: 'ADD' | 'REMOVE' | 'LEAVE') {
  return await graphQLBasicRequest(
    ` mutation query($emails: [String!]!, $action: SharingAction) {
        link(email: $emails, action: $action)
      }`,
    { emails, action }
  )
}

// export async function graphQLAddOrganization(name: string) {
//   return await graphQLBasicRequest(
//     ` mutation query($name: String!) {
//         createOrganization(name: $name) {
//           id
//           name
//         }
//       }`,
//     { name }
//   )
// }

export async function graphQLSetOrganization(name: string) {
  return await graphQLBasicRequest(
    ` mutation query($name: String!) {
        setOrganization(name: $name)
      }`,
    { name }
  )
}

// @TODO this is same as device list sharing mutation - refactor
export async function graphQLSetMembers(members: IOrganizationMember[], role: IOrganizationRole) {
  return await graphQLBasicRequest(
    ` mutation query($email: [String!]!, $role: OrganizationRole) {
        link(email: $email, role: $role)
      }`,
    { email: members.map(member => member.user.email), role }
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

export async function graphQLUpdateMetadata(params: INotificationSetting) {
  //@TODO: to add $notificationSystem: Boolean waiting API support
  return await graphQLBasicRequest(
    `
        mutation UpdateUserMetadata(
          $onlineDeviceNotification: Boolean
          $onlineSharedDeviceNotification: Boolean
          $portalUrl: String
          $notificationEmail: Boolean
          $notificationSystem: Boolean
        ) {
          setAttributes(
            attributes: {
              onlineDeviceNotification: $onlineDeviceNotification
              onlineSharedDeviceNotification: $onlineSharedDeviceNotification
              portalUrl: $portalUrl
              notificationEmail: $notificationEmail
              notificationSystem: $notificationSystem
            }
          )
        }
      `,
    params
  )
}

export async function graphQLUpdateNotification(params: INotificationSetting) {
  return await graphQLBasicRequest(
    `
        mutation UpdateUserMetadata(
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

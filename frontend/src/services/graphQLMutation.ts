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
        link(email: $emails, action: $action, scripting: true)
      }`,
    { emails, action }
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

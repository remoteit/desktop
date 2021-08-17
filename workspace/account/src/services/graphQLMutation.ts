import { graphQLBasicRequest } from './graphQL'



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

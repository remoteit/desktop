import { graphQLBasicRequest } from './graphQL'

export async function graphQLSetAttributes(attributes: ILookup<string | number | undefined>, serviceId: String) {
  return await graphQLBasicRequest(
    ` mutation query($attributes: Object!, $serviceId: String) {
        setAttributes(attributes: $attributes, serviceId: $serviceId)
      }`,
    { attributes: { $remoteit: attributes }, serviceId }
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

export async function graphQLSubscribe(params: IPurchase) {
  return await graphQLBasicRequest(
    ` mutation query($priceId: String!, $quantity: Int, $successUrl: String!, $cancelUrl: String!) {
        createSubscription(priceId: $priceId, quantity: $quantity, successUrl: $successUrl, cancelUrl: $cancelUrl) {
          url
        }
      }`,
    {
      ...params,
      successUrl: window.location.href,
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
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    }
  )
}

export async function graphQLUpdateSubscription(params: { priceId: string; quantity: number }) {
  return await graphQLBasicRequest(
    ` mutation query($priceId: String!, $quantity: Int) {
        updateSubscription(priceId: $priceId, quantity: $quantity) {
          url
        }
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

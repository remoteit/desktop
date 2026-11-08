import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import type { Endpoint } from '../services/graphQLProxy'

/* An endpoint of a local network proxy, beyond its public name (graphql-api docs/PROXY-GROUPS.md §14, decision 45):
   the .local name its devices announce on their network, then each device's IP and port — said after the public name,
   which is first. An https endpoint's certificate names its public name alone, so at these the browser warns about
   it: said beside each. Nothing for an endpoint of an Internet proxy. */
export const EndpointLocalAddresses: React.FC<{ endpoint: Pick<Endpoint, 'kind' | 'localAddresses'> }> = ({
  endpoint,
}) => {
  const { t } = useTranslation()
  if (!endpoint.localAddresses?.length) return null
  return (
    <>
      {endpoint.localAddresses.map(address => (
        <Typography key={address} component="div" variant="caption" color="textSecondary" data-local-address={address}>
          {endpoint.kind === 'https'
            ? t('endpoints.localAddressHttps', '{{address}} · the browser warns about the certificate here', {
                address,
              })
            : address}
        </Typography>
      ))}
    </>
  )
}

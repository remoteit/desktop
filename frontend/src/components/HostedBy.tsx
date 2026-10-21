import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { Link } from './Link'
import { Icon } from './Icon'

/* How a virtual device says it is one: "via Office gateway" under its name, wherever its name appears. The gateway is
   named only to someone who can see it (graphql gives its id and name only then); anyone else reads "via a gateway". A
   virtual device whose gateway was deleted is "not hosted". The turn arrow is the jump service's, so the two read as
   related. */

export function gatewayName(t: (key: string, fallback: string) => string, hostedBy?: IHostingGateway | null) {
  return hostedBy?.visible && hostedBy.name ? hostedBy.name : t('hostedBy.aGateway', 'a gateway')
}

type Props = {
  device?: IDevice
  link?: boolean // the gateway's name links to its page (where the viewer can open it)
  inline?: boolean
}

export const HostedByLine: React.FC<Props> = ({ device, link, inline }) => {
  const { t } = useTranslation()
  if (!device?.virtual) return null
  const hostedBy = device.hostedBy

  const name =
    hostedBy?.visible && hostedBy.id && link ? (
      <Link to={`/devices/${hostedBy.id}`} onClick={event => event.stopPropagation()}>
        {hostedBy.name}
      </Link>
    ) : (
      gatewayName(t, hostedBy)
    )

  return (
    <Box component={inline ? 'span' : 'div'} display="inline-flex" alignItems="center" gap={0.5} whiteSpace="nowrap">
      <Icon name="arrow-turn-down" rotate={270} type="solid" size="xxxs" color="grayDark" />
      <Typography component="span" variant="caption" color="textSecondary">
        {hostedBy ? (
          <>
            {t('hostedBy.via', 'via')} {name}
          </>
        ) : (
          t('hostedBy.notHosted', 'not hosted')
        )}
      </Typography>
    </Box>
  )
}

// Why a virtual device is online or offline: its gateway's state is its own, for now.
export function hostedStateTooltip(t: (key: string, options: any) => string, device?: IDevice): string | undefined {
  if (!device?.virtual) return
  if (!device.hostedBy)
    return t('hostedBy.notHostedTooltip', {
      defaultValue: 'Not hosted. Choose a gateway in its settings to bring it back online.',
    })
  const gateway = gatewayName((key, fallback) => t(key, { defaultValue: fallback }), device.hostedBy)
  return device.hostedBy.state === 'active'
    ? t('hostedBy.onlineTooltip', { gateway, defaultValue: 'Online while {{gateway}} is online' })
    : t('hostedBy.offlineTooltip', { gateway, defaultValue: 'Offline while {{gateway}} is offline' })
}

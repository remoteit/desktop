import React, { useState } from 'react'
import { Box } from '@mui/material'
import { Icon } from './Icon'
import { appIcon } from '../helpers/appsHelper'
import { fontSizes, Sizes } from '../styling'

/* An app's icon where it shows one (remoteit/apps docs/contract.md, "Packaging and trust"): its release's PNG, served by
   remote.it beside the release's manifest and checked when it was published — only ever an image, never SVG —, else,
   for an app without one, an older remote.it that does not say it, or one that fails to load, the icon of how its
   service opens (helpers/appsHelper appIcon). Only an https URL is drawn: anything else is not one graphql gives. */
export const AppIcon: React.FC<{ icon?: string | null; protocol?: string | null; size: Sizes }> = ({
  icon,
  protocol,
  size,
}) => {
  const [broken, setBroken] = useState<string>()
  if (icon && icon !== broken && icon.startsWith('https://'))
    return (
      <Box
        component="img"
        src={icon}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(icon)}
        data-app-icon
        sx={{
          width: `calc(${fontSizes[size]} * 1.25)`,
          height: `calc(${fontSizes[size]} * 1.25)`,
          objectFit: 'contain',
          borderRadius: '22%',
          verticalAlign: 'middle',
        }}
      />
    )
  return <Icon name={appIcon(protocol)} size={size} fixedWidth />
}

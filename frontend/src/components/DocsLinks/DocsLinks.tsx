import React from 'react'
import { Box, Typography } from '@mui/material'
import { spacing } from '../../styling'
import { Icon } from '../../components/Icon'
import { Link } from '../../components/Link'

export const DocsLinks: React.FC<{ os?: Ios }> = ({ os }) => {
  return (
    <Box
      component="section"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: `${spacing.xl}px`,
        '& svg': { paddingLeft: '5px', marginLeft: '3px' },
      }}
    >
      <Typography variant="body2" align="center" gutterBottom>
        See how to:
      </Typography>
      <Link href="https://link.remote.it/documentation-desktop/overview">
        Use Remote.It Desktop
        <Icon rotate={-45} name="arrow-right" size="sm" type="regular" />
      </Link>
      <Link href={`https://link.remote.it/documentation-desktop/${os}-connections`}>
        Connect to this device from anywhere
        <Icon rotate={-45} name="arrow-right" size="sm" type="regular" />
      </Link>
    </Box>
  )
}

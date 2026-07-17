import React from 'react'
import { Link } from '../Link'
import { State } from '../../store'
import { Box, Tooltip, Theme } from '@mui/material'
import { useSelector } from 'react-redux'
import { spacing, fontSizes } from '../../styling'

export const OutOfBand: React.FC<{ inline?: boolean }> = ({ inline }) => {
  const available = useSelector((state: State) => state.backend.environment.oobAvailable)
  const active = useSelector((state: State) => state.backend.interfaces.length > 1)

  if (!available) return null

  return (
    <Box
      component="span"
      sx={inline ? undefined : { top: `${spacing.xs}px`, right: `${spacing.lg}px`, position: 'absolute', zIndex: 3 }}
    >
      <Tooltip title={active ? 'Mode active' : 'Mode inactive'}>
        <Link href="https://link.remote.it/documentation-guides/out-of-band">
          <Box
            sx={[
              theme => ({
                border: `1px solid ${theme.palette.grayLight.main}`,
                padding: `${spacing.xxs}px ${spacing.sm}px`,
                borderRadius: `${spacing.xs}px`,
                display: 'inline-flex',
                color: theme.palette.gray.main,
                alignItems: 'center',
                '& small': {
                  fontWeight: 400,
                  fontSize: fontSizes.xxs,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                },
                '& span': {
                  width: `${spacing.xs}px`,
                  height: `${spacing.xs}px`,
                  borderRadius: '50%',
                  display: 'block',
                  marginRight: `${spacing.xs}px`,
                  backgroundColor: theme.palette.grayLight.main,
                },
              }),
              active
                ? (theme: Theme) => ({
                    border: 0,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.white.main,
                    '& small': {
                      fontWeight: 500,
                    },
                    '& span': {
                      backgroundColor: theme.palette.white.main,
                      boxShadow: `0 0 8px ${theme.palette.white.main}`,
                    },
                  })
                : {},
            ]}
          >
            <span />
            <small>Out of Band</small>
          </Box>
        </Link>
      </Tooltip>
    </Box>
  )
}

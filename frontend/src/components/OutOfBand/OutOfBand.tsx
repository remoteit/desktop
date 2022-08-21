import React from 'react'
import { Link } from '../Link'
import { Tooltip } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { spacing, fontSizes } from '../../styling'

export const OutOfBand: React.FC<{ inline?: boolean }> = ({ inline }) => {
  const css = useStyles()
  const { available, active } = useSelector((state: ApplicationState) => ({
    available: state.backend.environment.oobAvailable,
    active: state.backend.interfaces.length > 1,
  }))

  if (!available) return null

  return (
    <span className={inline ? undefined : css.container}>
      <Tooltip title={active ? 'Mode active' : 'Mode inactive'}>
        <Link href="https://link.remote.it/documentation-guides/out-of-band">
          <div className={css.oob + (active ? ' ' + css.active : '')}>
            <span />
            <small>Out of Band</small>
          </div>
        </Link>
      </Tooltip>
    </span>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    top: spacing.xs,
    right: spacing.lg,
    position: 'absolute',
    zIndex: 3,
  },
  oob: {
    border: `1px solid ${palette.grayLight.main}`,
    padding: `${spacing.xxs}px ${spacing.sm}px`,
    borderRadius: spacing.xs,
    display: 'inline-flex',
    color: palette.gray.main,
    alignItems: 'center',
    '& small': {
      fontWeight: 400,
      fontSize: fontSizes.xxs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    '& span': {
      width: spacing.xs,
      height: spacing.xs,
      borderRadius: '50%',
      display: 'block',
      marginRight: spacing.xs,
      backgroundColor: palette.grayLight.main,
    },
  },
  active: {
    border: 0,
    backgroundColor: palette.primary.main,
    color: palette.white.main,
    '& small': {
      fontWeight: 500,
    },
    '& span': {
      backgroundColor: palette.white.main,
      boxShadow: `0 0 8px ${palette.white.main}`,
    },
  },
}))

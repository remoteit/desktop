import React, { useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { Tooltip, Link } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { colors, spacing, fontSizes } from '../../styling'
import { emit } from '../../services/Controller'

export const OutOfBand: React.FC<{ inline?: boolean }> = ({ inline }) => {
  const css = useStyles()
  const { available, active } = useSelector((state: ApplicationState) => ({
    available: state.backend.lan.oobAvailable,
    active: state.backend.lan.oobActive,
  }))

  useEffect(() => {
    emit('oobCheck')
    let timer = setInterval(() => emit('oobCheck'), 30000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  if (!available) return null

  return (
    <span className={inline ? undefined : css.container}>
      <Tooltip title={active ? 'Mode active' : 'Mode inactive'}>
        <Link href="https://link.remote.it/documentation-guides/out-of-band" target="_blank">
          <div className={css.oob + (active ? ' ' + css.active : '')}>
            <span />
            <small>Out of Band</small>
          </div>
        </Link>
      </Tooltip>
    </span>
  )
}

const useStyles = makeStyles({
  container: {
    top: spacing.xs,
    right: spacing.lg,
    position: 'absolute',
  },
  oob: {
    border: `1px solid ${colors.grayLight}`,
    padding: `${spacing.xxs}px ${spacing.sm}px`,
    borderRadius: spacing.xs,
    display: 'inline-flex',
    color: colors.gray,
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
      backgroundColor: colors.grayLight,
    },
  },
  active: {
    border: 0,
    backgroundColor: colors.primary,
    color: colors.white,
    '& small': {
      fontWeight: 500,
    },
    '& span': {
      backgroundColor: colors.white,
      boxShadow: `0 0 8px ${colors.white}`,
    },
  },
})

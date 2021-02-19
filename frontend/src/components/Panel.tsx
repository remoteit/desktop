import React from 'react'
import { makeStyles } from '@material-ui/core'
import { colors, spacing } from '../styling'
import { Header } from './Header'
import { Body } from './Body'

type Props = {
  primary?: boolean
  secondary?: boolean
}
export const Container: React.FC<Props> = ({ primary, secondary, children }) => {
  const css = useStyles()

  return <div className={css.primary}>{primary && <Header />}</div>
}

const useStyles = makeStyles({
  primary: {},
  container: {
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.white,
    position: 'relative',
    boxShadow: `0 1px 2px ${colors.darken}`,
    zIndex: 3,
    '& .MuiTypography-h1': {
      display: 'flex',
      alignItems: 'center',
      padding: `${spacing.xxs}px ${spacing.xl - 8}px ${spacing.xxs}px ${spacing.xl}px`,
      minHeight: 50,
    },
  },
  sidebar: {
    display: 'flex',
    flexFlow: 'row',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  sideContent: {
    boxShadow: `-1px 0 2px ${colors.darken}`,
    backgroundColor: colors.white,
    position: 'relative',
    zIndex: 2,
  },
})

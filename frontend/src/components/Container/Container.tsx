import React from 'react'
import { makeStyles } from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { Body } from '../Body'

type Props = { header: any; sidebar?: any; footer?: any; integrated?: boolean; bodyProps?: any }

export const Container: React.FC<Props> = ({ header, sidebar, footer, integrated, bodyProps, children }) => {
  const css = useStyles()
  return (
    <div className={css.container}>
      <div className={integrated ? undefined : css.header}>{header}</div>
      {sidebar ? (
        <div className={css.sidebar}>
          <Body {...bodyProps}>{children}</Body>
          <div className={css.sideContent}>{sidebar}</div>
        </div>
      ) : (
        <Body {...bodyProps}>{children}</Body>
      )}
      {footer && <div>{footer}</div>}
    </div>
  )
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
    position: 'relative',
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

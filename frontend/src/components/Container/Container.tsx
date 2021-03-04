import React from 'react'
import { makeStyles, Divider } from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { Body } from '../Body'

type Props = {
  header: any
  sidebar?: any
  footer?: any
  integrated?: boolean
  bodyProps?: any
  bodyRef?: React.RefObject<HTMLDivElement>
}

export const Container: React.FC<Props> = ({ header, sidebar, footer, integrated, bodyProps, bodyRef, children }) => {
  const css = useStyles()

  return (
    <div className={css.container}>
      <div className={integrated ? undefined : css.header}>
        {header}
        {integrated || <Divider variant="inset" />}
      </div>
      {sidebar ? (
        <div className={css.sidebar}>
          <Body {...bodyProps}>{children}</Body>
          <div className={css.sideContent}>{sidebar}</div>
        </div>
      ) : (
        <Body bodyRef={bodyRef} {...bodyProps}>
          {children}
        </Body>
      )}
      {footer && (
        <div className={css.footer}>
          <Divider variant="inset" />
          {footer}
        </div>
      )}
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
    overflow: 'hidden',
  },
  header: {
    position: 'relative',
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
    position: 'relative',
    zIndex: 2,
  },
  footer: {
    position: 'relative',
    zIndex: 3,
  },
})

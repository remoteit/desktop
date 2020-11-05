import React from 'react'
import { makeStyles } from '@material-ui/core'
import { colors } from '../../styling'
import { Body } from '../Body'

type Props = { header: any; sidebar?: any; footer?: any; inset?: boolean; integrated?: boolean }

export const Container: React.FC<Props> = ({ header, sidebar, footer, inset, integrated, children }) => {
  const css = useStyles()
  return (
    <div className={css.container}>
      <div className={integrated ? undefined : css.header}>{header}</div>
      {sidebar ? (
        <div className={css.sidebar}>
          <Body inset={inset}>{children}</Body>
          <div className={css.fixed}>{sidebar}</div>
        </div>
      ) : (
        <Body inset={inset}>{children}</Body>
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
  },
  sidebar: {
    display: 'flex',
    flexFlow: 'row',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  fixed: {
    display: 'fixed',
    boxShadow: `-1px 0 2px ${colors.darken}`,
    backgroundColor: colors.white,
    position: 'relative',
    zIndex: 2,
  },
})

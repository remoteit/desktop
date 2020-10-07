import React from 'react'
import { makeStyles } from '@material-ui/core'
import { colors } from '../../styling'
import { Body } from '../Body'

type Props = { header: any; footer?: any; inset?: boolean; integrated?: boolean }

export const Container: React.FC<Props> = ({ header, footer, inset, integrated, children }) => {
  const css = useStyles()
  return (
    <div className={css.container}>
      <div className={integrated ? undefined : css.header}>{header}</div>
      <Body inset={inset}>{children}</Body>
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
  },
  header: {
    backgroundColor: colors.white,
    position: 'relative',
    boxShadow: 'rgba(0,0,0,0.15) 0px 1px 2px',
    zIndex: 2,
  },
})

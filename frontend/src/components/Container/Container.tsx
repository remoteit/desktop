import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Body } from '../Body'

type Props = { header: any; footer?: any; inset?: boolean }

export const Container: React.FC<Props> = ({ header, footer, inset, children }) => {
  const css = useStyles()
  return (
    <div className={css.container}>
      <div>{header}</div>
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
})

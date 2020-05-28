import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import { Body } from '../Body'

type Props = { header: any; inset?: boolean; scrollbars?: boolean }

export const Container: React.FC<Props> = ({ header, inset, scrollbars, children }) => {
  const css = useStyles()
  return (
    <div className={css.container}>
      <div>{header}</div>
      <Body inset={inset} scrollbars={scrollbars}>
        {children}
      </Body>
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

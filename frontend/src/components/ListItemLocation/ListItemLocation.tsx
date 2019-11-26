import React from 'react'
import { useHistory } from 'react-router-dom'
import { ListItem } from '@material-ui/core'
import { NextButton } from '../NextButton'

export type Props = {
  pathname: string
  disabled?: boolean
}

export const ListItemLocation: React.FC<Props> = ({ pathname, disabled = false, children, ...props }) => {
  const history = useHistory()
  const onClick = () => !disabled && history.push(pathname)
  return (
    <ListItem button onClick={onClick} disabled={disabled} {...props} style={{ opacity: 1 }}>
      {!disabled && <NextButton />}
      {children}
    </ListItem>
  )
}

import React from 'react'
import { useHistory } from 'react-router-dom'
import { ListItem } from '@material-ui/core'
import { NextButton } from '../../buttons/NextButton'

export type Props = {
  pathname: string
  disabled?: boolean
  className?: string
}

export const ListItemLocation: React.FC<Props> = ({ pathname, disabled = false, children, ...props }) => {
  const history = useHistory()
  const onClick = () => !disabled && history.push(pathname)
  return (
    <ListItem {...props} button onClick={onClick} disabled={disabled} style={{ opacity: 1 }}>
      {!disabled && <NextButton />}
      {children}
    </ListItem>
  )
}

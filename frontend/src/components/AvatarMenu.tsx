import React from 'react'
import { makeStyles, ButtonBase, Tooltip } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Avatar } from './Avatar'
import { colors } from '../styling'

export interface Props {}

export const AvatarMenu: React.FC<Props> = ({}) => {
  const { user } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
  }))

  const css = useStyles()

  return <Avatar email={user?.email} />
}

const useStyles = makeStyles({
  label: {
    display: 'flex',
  },
  avatar: {
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: colors.white,
    '&:hover': { borderColor: colors.primaryLight },
  },
})

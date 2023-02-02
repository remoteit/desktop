import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectPermissions } from '../models/organization'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'

export const RegisterMenu: React.FC = () => {
  const css = useStyles()
  const permissions = useSelector((state: ApplicationState) => selectPermissions(state))
  const disabled = !permissions?.includes('MANAGE')

  return (
    <IconButton
      title={
        disabled ? (
          <>
            Register permission required to <br />
            add a device to this organization.
          </>
        ) : (
          'Add device'
        )
      }
      to="/add"
      forceTitle
      hideDisableFade
      className={css.register}
      variant="contained"
      disabled={disabled}
      color="primary"
      icon="plus"
      type="solid"
    />
  )
}

const useStyles = makeStyles({
  register: {
    borderRadius: '50%',
    marginRight: spacing.xxs,
    width: 40,
    height: 40,
  },
})

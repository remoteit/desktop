import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectPermissions } from '../selectors/organizations'
import { IconButton, ButtonProps } from '../buttons/IconButton'
import { spacing } from '../styling'

type Props = ButtonProps & { buttonSize?: number }

export const RegisterMenu: React.FC<Props> = ({ buttonSize, ...props }) => {
  const css = useStyles({ buttonSize })
  const permissions = useSelector((state: ApplicationState) => selectPermissions(state))
  const disabled = !permissions?.includes('MANAGE')

  return (
    <IconButton
      {...props}
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
  register: ({ buttonSize }: Props) => ({
    borderRadius: '50%',
    marginRight: spacing.xxs,
    width: buttonSize,
    height: buttonSize,
  }),
})

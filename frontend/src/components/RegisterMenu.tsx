import React from 'react'
import { makeStyles } from '@mui/styles'
import { Typography } from '@mui/material'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { GuideBubble } from './GuideBubble'
import { ApplicationState } from '../store'
import { selectPermissions } from '../selectors/organizations'
import { IconButton, ButtonProps } from '../buttons/IconButton'
import { spacing } from '../styling'

type Props = ButtonProps & { buttonSize?: number; sidebar?: boolean }

export const RegisterMenu: React.FC<Props> = ({ buttonSize, sidebar, ...props }) => {
  const location = useLocation()
  const css = useStyles({ buttonSize })
  const permissions = useSelector((state: ApplicationState) => selectPermissions(state))
  const unauthorized = !permissions?.includes('MANAGE')
  const disabled = unauthorized || location.pathname === '/add'

  if (unauthorized) return null

  return (
    <GuideBubble
      sidebar={sidebar}
      guide="addDevice"
      placement="bottom"
      startDate={new Date('2022-09-20')}
      enterDelay={400}
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>Add a device</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            First step is to install our agent on any device you would like to connect to.
          </Typography>
          <Typography variant="body2" gutterBottom>
            Your device will automatically register and appear on the <cite>devices</cite> page.
          </Typography>
        </>
      }
    >
      <IconButton
        {...props}
        title={
          unauthorized ? (
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
    </GuideBubble>
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

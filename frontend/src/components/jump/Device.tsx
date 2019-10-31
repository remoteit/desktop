import React, { useState, useEffect } from 'react'
import Targets from './Targets'
import { TextField, Button, CircularProgress, Tooltip, IconButton, Snackbar, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../Icon'
import { NAME_SAFE } from '../../helpers/regEx'
import styles from '../../styling'

type Props = {
  targets: ITarget[]
  device: IDevice
  added?: ITarget
  onUpdate: (target: ITarget[]) => void
  onDevice: (device: IDevice) => void
  onDelete: () => void
  onCancel: () => void
}

const Device: React.FC<Props> = ({ device, onDevice, onDelete, ...props }) => {
  const css = useStyles()
  const [name, setName] = useState<string>(device.name)
  const [registering, setRegistering] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [notice, setNotice] = useState<boolean>(false)
  const registered = !!device.uid
  const confirmMessage = "Are you sure?\nYou are about to permanently remove this device and all of it's services."

  useEffect(() => {
    if (registering && device.uid) setRegistering(false)
    if (deleting && !device.uid) setDeleting(false)
  }, [device, deleting, registering])

  return (
    <div>
      <Typography variant="subtitle1">Device</Typography>
      <section className={css.device}>
        <div className={css.name}>
          <TextField
            label="Device Name"
            className={css.input}
            disabled={registered}
            value={name || device.name}
            onChange={event => {
              const value = event.target.value.replace(NAME_SAFE, '')
              if (value !== event.target.value) setNotice(true)
              setName(value)
            }}
            onFocus={event => event.target.select()}
            helperText={!registered && '*Must be unique'}
            inputProps={{ 'data-lpignore': 'true' }}
          />
          {deleting ? (
            <CircularProgress className={css.loading} size={styles.fontSizes.lg} />
          ) : (
            device.uid && (
              <Tooltip title="Delete">
                <IconButton
                  onClick={() => {
                    if (window.confirm(confirmMessage)) {
                      onDelete()
                      setDeleting(true)
                    }
                  }}
                >
                  <Icon name="trash-alt" size="md" />
                </IconButton>
              </Tooltip>
            )
          )}
        </div>
        <Button
          color="primary"
          variant="contained"
          className={css.register}
          onClick={() => {
            onDevice({ ...device, name })
            setRegistering(true)
          }}
          disabled={!name || registered}
        >
          {registered ? 'Registered' : 'Register'}
          {registering ? (
            <CircularProgress className={css.registering} size={styles.fontSizes.lg} thickness={4} />
          ) : (
            <Icon name="check" weight="regular" inline />
          )}
        </Button>
      </section>

      <Typography variant="subtitle1">Services</Typography>
      <section>
        {registered ? (
          <Targets device={device} {...props} />
        ) : (
          <p className={css.note}>You may add services after device registration.</p>
        )}
      </section>
      <Snackbar
        open={!!notice}
        autoHideDuration={2000}
        onClose={() => setNotice(false)}
        message="Device names can only contain alpha numeric characters."
      />
    </div>
  )
}

export default Device

const useStyles = makeStyles({
  name: {
    '& button': {
      marginTop: styles.spacing.md,
      marginLeft: styles.spacing.md,
    },
  },
  device: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  register: {
    marginTop: styles.spacing.md,
    marginRight: 0,
  },
  loading: { color: styles.colors.gray, margin: styles.spacing.md },
  input: {
    width: 300,
  },
  registering: {
    color: styles.colors.white,
    marginLeft: styles.spacing.md,
  },
  note: {
    width: '100%',
    textAlign: 'center',
    color: styles.colors.grayLight,
    margin: styles.spacing.xl,
  },
})

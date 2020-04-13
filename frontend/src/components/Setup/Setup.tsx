import React, { useState, useEffect } from 'react'
import { Breadcrumbs } from '../Breadcrumbs'
import { LocalhostScanForm } from '../LocalhostScanForm'
import { TextField, Button, CircularProgress, Tooltip, IconButton, Typography, Snackbar } from '@material-ui/core'
import { safeHostname, osName } from '../../helpers/nameHelper'
import { REGEX_NAME_SAFE } from '../../constants'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../Container'
import { Targets } from '../Targets'
import { Body } from '../Body'
import { Icon } from '../Icon'
import styles from '../../styling'

type Props = {
  targets: ITarget[]
  device: IDevice
  added?: ITarget
  cliError?: string
  nameBlacklist: string[]
  hostname: string
  os?: Ios
  onUpdate: (targets: ITarget[]) => void
  onRegistration: (registration: IRegistration) => void
  onDelete: () => void
  onCancel: () => void
}

export const Setup: React.FC<Props> = ({ device, onRegistration, onDelete, nameBlacklist, hostname, os, ...props }) => {
  const css = useStyles()
  const [name, setName] = useState<string>(device.name || safeHostname(hostname, nameBlacklist))
  const [disableRegister, setDisableRegister] = useState<boolean>(false)
  const [registering, setRegistering] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [nameError, setNameError] = useState<string>()
  const [selected, setSelected] = useState<ITarget[]>([])
  const [successMessage, setSuccessMessage] = useState<boolean>(false)
  const registered = !!device.uid
  const confirmMessage = 'Are you sure?\nYou are about to permanently remove this device and all of its services.'

  useEffect(() => {
    if (registering && (device.uid || props.cliError)) {
      setRegistering(false)
      setSuccessMessage(true)
    }
    if (deleting && (!device.uid || props.cliError)) {
      setDeleting(false)
      setName(safeHostname(hostname, nameBlacklist))
    }
  }, [device, deleting, registering, props.cliError])

  return (
    <>
      <Container
        header={
          <>
            <Breadcrumbs />
            {registered && (
              <>
                <Typography variant="h1" gutterBottom>
                  This Device
                </Typography>
              </>
            )}
          </>
        }
      >
        <Body center={!registered}>
          {registered || (
            <Typography variant="body2" align="center" color="textSecondary">
              Register your {osName(os)} for remote access
            </Typography>
          )}
          <form
            onSubmit={event => {
              if (!name || registered) return
              event.preventDefault()
              onRegistration({ device: { ...device, name }, targets: selected })
              setRegistering(true)
            }}
          >
            <section className={css.device}>
              <div className={css.name}>
                <TextField
                  label="Name"
                  className={css.input}
                  disabled={registering || registered}
                  value={name || device.name}
                  variant="filled"
                  error={!!nameError}
                  onChange={event => {
                    const value = event.target.value.replace(REGEX_NAME_SAFE, '')
                    if (value !== event.target.value) {
                      setNameError('Device names can only contain alpha numeric characters.')
                    } else if (nameBlacklist.includes(value.toLowerCase().trim())) {
                      setNameError('That device name is already in use.')
                      setDisableRegister(true)
                    } else {
                      setNameError(undefined)
                      setDisableRegister(false)
                    }
                    setName(value)
                  }}
                  onFocus={event => event.target.select()}
                  helperText={nameError || (!registered && '*Must be unique')}
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
                {registered || (
                  <Button
                    color="primary"
                    variant="contained"
                    size="medium"
                    disabled={!name || disableRegister}
                    type="submit"
                  >
                    {registered ? 'Registered' : 'Register'}
                    {registering ? (
                      <CircularProgress className={css.registering} size={styles.fontSizes.lg} thickness={4} />
                    ) : (
                      <Icon name="check" weight="regular" inline />
                    )}
                  </Button>
                )}
              </div>
            </section>
            {!registered && <LocalhostScanForm setSelected={setSelected} />}
          </form>
        </Body>

        {registered && (
          <>
            <Typography variant="h1" gutterBottom>
              Hosted Services
            </Typography>
            <section>
              <Targets device={device} {...props} />
            </section>
          </>
        )}
      </Container>
      <Snackbar
        open={successMessage}
        onClose={() => setSuccessMessage(false)}
        message={
          <>
            <Icon name="check-circle" size="md" color="success" weight="regular" fixedWidth inlineLeft />
            {`${device.name} was successfully registered!`}
          </>
        }
        autoHideDuration={5000}
      />
    </>
  )
}

const useStyles = makeStyles({
  name: {
    '& button': {
      marginTop: styles.spacing.xxs,
      marginLeft: styles.spacing.lg,
    },
  },
  device: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
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
    textAlign: 'center',
    color: styles.colors.grayDark,
    margin: styles.spacing.xxl,
  },
})

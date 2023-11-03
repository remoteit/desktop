import React, { useState, useEffect, useRef } from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { TextField } from '@mui/material'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { spacing } from '../styling'

const CLAIM_CODE_LENGTH = 8

export function ClaimDevice() {
  const css = useStyles()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { devices } = useDispatch<Dispatch>()
  const [code, setCode] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const { claiming, organization, user } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    organization: selectOrganization(state),
    user: state.user,
  }))

  useEffect(() => {
    if (!claiming) handleClose()
  }, [claiming])

  const handleClose = () => {
    setValid(false)
    setCode('')
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = event.target
    if (value.length >= CLAIM_CODE_LENGTH) {
      value = value.substring(0, CLAIM_CODE_LENGTH)
      setValid(true)
    } else {
      setValid(false)
    }
    setCode(value.toUpperCase())
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        buttonRef.current?.click()
      }}
    >
      <TextField
        className={css.form}
        label="Claim Code"
        value={code}
        variant="filled"
        disabled={claiming}
        onChange={handleChange}
        InputProps={{
          endAdornment: (
            <ConfirmButton
              ref={buttonRef}
              title="Claim"
              icon="check"
              size="base"
              type="solid"
              confirm={organization.id !== user.id}
              color={claiming || !valid ? 'grayDark' : 'success'}
              loading={claiming}
              disabled={claiming || !valid}
              onClick={() => devices.claimDevice({ code, redirect: true })}
              confirmProps={{
                title: `Claiming for ${organization.name}`,
                action: 'Ok',
                children: 'You are claiming this device for an organization instead of yourself.',
              }}
            />
          ),
        }}
      />
    </form>
  )
}

const useStyles = makeStyles({
  form: {
    width: 160,
    display: 'flex',
    '& .MuiIconButton-root': { marginRight: spacing.xs },
    '& .MuiFilledInput-root': { fontSize: 14 },
  },
})
import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { List, ListSubheader, ListItem, TextField } from '@mui/material'
import { Icon } from '../components/Icon'

const CLAIM_CODE_LENGTH = 8
type Props = { className?: string }

export const ClaimDevice: React.FC<Props> = ({ className }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { devices } = useDispatch<Dispatch>()
  const [code, setCode] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const organization = useSelector((state: State) => selectOrganization(state))
  const claiming = useSelector((state: State) => state.ui.claiming)
  const user = useSelector((state: State) => state.user)

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
    <List className={className} dense disablePadding>
      <ListSubheader disableGutters>Claim a device</ListSubheader>
      <ListItem sx={{ paddingTop: 3 }} disablePadding>
        <form
          style={{
            width: 160,
            textAlign: 'right',
          }}
          onSubmit={e => {
            e.preventDefault()
            buttonRef.current?.click()
          }}
        >
          <TextField
            label="Claim Code"
            value={code}
            variant="filled"
            disabled={claiming}
            onChange={handleChange}
            sx={{
              width: { xs: 130, sm: 160 },
              display: 'flex',
              marginBottom: 0.75,
              justifyContent: 'flex-end',
              marginLeft: -1.5,
              '& svg': { marginRight: 2.25 },
              '& .MuiFilledInput-root': { fontSize: 14 },
            }}
            InputProps={{
              endAdornment: code && (
                <Icon
                  name={claiming ? 'spinner-third' : 'check'}
                  size="base"
                  type="solid"
                  color={claiming || !valid ? 'gray' : 'success'}
                  spin={!!claiming}
                  fixedWidth
                />
              ),
            }}
          />
          <ConfirmButton
            ref={buttonRef}
            size="chip"
            sx={{ marginRight: 0.375 }}
            variant={valid ? 'contained' : 'text'}
            title={claiming ? 'Claiming' : 'Claim'}
            confirm={organization.id !== user.id}
            disabled={claiming || !valid}
            onClick={() => devices.claimDevice({ code, redirect: true })}
            confirmProps={{
              title: `Claiming for ${organization.name}`,
              action: 'Ok',
              children: 'You are claiming this device for an organization instead of yourself.',
            }}
          />
        </form>
      </ListItem>
    </List>
  )
}

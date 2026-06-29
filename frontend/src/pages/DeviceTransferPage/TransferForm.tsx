import React, { useState } from 'react'
import { Typography, Button } from '@mui/material'
import { ContactSelector } from '../../components/ContactSelector'
import { useHistory } from 'react-router-dom'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Confirm } from '../../components/Confirm'

type Props = {
  title: string
  contacts: IUserRef[]
  transferring: boolean
  disabled?: boolean
  notice?: React.ReactNode
  description?: React.ReactNode
  confirmContent: (email: string) => React.ReactNode
  onTransfer: (email: string) => void | Promise<void>
}

export const TransferForm: React.FC<Props> = ({
  title,
  contacts,
  transferring,
  disabled,
  notice,
  description,
  confirmContent,
  onTransfer,
}) => {
  const history = useHistory()
  const [open, setOpen] = useState<boolean>(false)
  const [email, setEmail] = useState<string | undefined>()

  const handleChange = (emails: string[]) => setEmail(emails.length > 0 ? emails[0] : undefined)

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">{title}</Typography>
          <Gutters top={null}>
            <ContactSelector
              contacts={contacts}
              selected={email ? [email] : []}
              onSelect={handleChange}
              isMulti={false}
            />
          </Gutters>
        </>
      }
    >
      {notice && <Gutters bottom={null}>{notice}</Gutters>}
      <Gutters>{description}</Gutters>
      <Gutters top="xl">
        <Button
          color="primary"
          onClick={() => setOpen(true)}
          disabled={!email || disabled || transferring}
          variant="contained"
        >
          {transferring ? 'Transferring...' : 'Transfer'}
        </Button>
        <Button disabled={transferring} onClick={() => history.goBack()}>
          Cancel
        </Button>
      </Gutters>
      <Confirm
        open={open}
        onConfirm={() => {
          setOpen(false)
          if (email) onTransfer(email)
        }}
        onDeny={() => setOpen(false)}
        color="error"
        title="Are you sure?"
        action="Transfer"
      >
        {email && confirmContent(email)}
      </Confirm>
    </Container>
  )
}

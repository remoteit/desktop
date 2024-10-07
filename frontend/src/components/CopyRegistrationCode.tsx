import React from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { isUserAccount } from '../selectors/accounts'
import { CopyCodeBlock, CopyCodeBlockProps } from './CopyCodeBlock'
import { Confirm } from './Confirm'

export function CopyRegistrationCode(props: CopyCodeBlockProps) {
  const hasOrgs = useSelector((state: State) => !!state.accounts.membership.length)
  const userAccountActive = useSelector(isUserAccount)

  const [open, setOpen] = React.useState(false)

  return (
    <>
      <CopyCodeBlock {...props} onCopy={hasOrgs && userAccountActive ? () => setOpen(true) : undefined} />
      <Confirm title="Registering to your personal account" action="Ok" open={open} onConfirm={() => setOpen(false)}>
        This registration code will register to your personal account instead of an organization.
      </Confirm>
    </>
  )
}

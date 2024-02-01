import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { CopyCodeBlock, CopyCodeBlockProps } from './CopyCodeBlock'
import { Confirm } from './Confirm'

export function CopyRegistrationCode(props: CopyCodeBlockProps) {
  const { organization, user } = useSelector((state: ApplicationState) => ({
    organization: selectOrganization(state),
    user: state.user,
  }))

  const [open, setOpen] = React.useState(false)

  return (
    <>
      <CopyCodeBlock
        {...props}
        onClick={organization.id && organization.id !== user.id ? () => setOpen(true) : undefined}
      />
      <Confirm title={`Registering to ${organization.name}`} action="Ok" open={open} onConfirm={() => setOpen(false)}>
        This registration code will register to an organization instead of your personal account.
      </Confirm>
    </>
  )
}

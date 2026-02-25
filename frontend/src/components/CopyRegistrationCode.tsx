import React from 'react'
import { State, Dispatch } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { CopyCodeBlock, CopyCodeBlockProps } from './CopyCodeBlock'

export function CopyRegistrationCode(props: CopyCodeBlockProps) {
  const dispatch = useDispatch<Dispatch>()
  const { organization, user } = useSelector((state: State) => ({
    organization: selectOrganization(state),
    user: state.user,
  }))

  const setMessage = () => {
    dispatch.ui.set({
      noticeMessage: (
        <>
          The copied code will register devices to the <b>{organization.name}</b> organization.
        </>
      ),
    })
  }

  return <CopyCodeBlock {...props} onCopy={organization.id && organization.id !== user.id ? setMessage : undefined} />
}

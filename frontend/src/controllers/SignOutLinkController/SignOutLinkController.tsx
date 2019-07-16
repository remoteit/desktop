import { connect } from 'react-redux'
import { SignOutLink } from '../../components/SignOutLink'

export type SignOutLinkControllerProps = ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({ signOut: dispatch.auth.signOut })

export const SignOutLinkController = connect(
  null,
  mapDispatch
)(SignOutLink)

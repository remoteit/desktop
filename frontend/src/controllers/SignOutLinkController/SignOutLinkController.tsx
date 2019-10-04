import { connect } from 'react-redux'
import { SignOutLink } from '../../components/SignOutLink'

const mapDispatch = (dispatch: any) => ({ signOut: dispatch.auth.signOut })

export type SignOutLinkControllerProps = ReturnType<typeof mapDispatch>

export const SignOutLinkController = connect(
  null,
  mapDispatch
)(SignOutLink)

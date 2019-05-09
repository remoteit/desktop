import { connect } from 'react-redux'
import { SignInForm } from '../../components/SignInForm'

export type SignInFormControllerProps = ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({ signIn: dispatch.auth.signIn })

export const SignInFormController = connect(
  null,
  mapDispatch
)(SignInForm)

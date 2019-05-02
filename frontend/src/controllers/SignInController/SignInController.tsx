import { SignInPage } from '../../components/SignInPage'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'

export type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({ user: state.auth.user })
const mapDispatch = (dispatch: any) => ({ login: dispatch.auth.login })

export const SignInController = connect(
  mapState,
  mapDispatch
)(SignInPage)

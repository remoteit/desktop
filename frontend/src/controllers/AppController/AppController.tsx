import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { App } from '../../components/App'

export type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  checkSignInStarted: state.auth.checkSignInStarted,
  user: state.auth.user,
  page: state.navigation.page,
})
const mapDispatch = (dispatch: any) => ({
  checkSignIn: dispatch.auth.checkSignIn,
  setPage: dispatch.navigation.setPage,
})

export const AppController = connect(
  mapState,
  mapDispatch
)(App)

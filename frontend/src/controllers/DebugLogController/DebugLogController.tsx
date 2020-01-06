import { DebugLog } from '../../components/DebugLog'
import { ApplicationState } from '../../store'
import { connect } from 'react-redux'

export type Props = ReturnType<typeof mapState> // & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  logs: [], //state.logs as Log[],
})
// const mapDispatch = (dispatch: any) => ({ signIn: dispatch.auth.signIn })

export const DebugLogController = connect(
  mapState
  // mapDispatch
)(DebugLog)

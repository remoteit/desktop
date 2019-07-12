import { connect } from 'react-redux'
import { QuitLink } from '../../components/QuitLink'

export type QuitLinkControllerProps = ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({ quit: dispatch.auth.quit })

export const QuitLinkController = connect(
  null,
  mapDispatch
)(QuitLink)

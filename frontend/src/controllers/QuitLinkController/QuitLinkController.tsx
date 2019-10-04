import { connect } from 'react-redux'
import { QuitLink } from '../../components/QuitLink'

const mapDispatch = (dispatch: any) => ({ quit: dispatch.auth.quit })

export type QuitLinkControllerProps = ReturnType<typeof mapDispatch>

export const QuitLinkController = connect(
  null,
  mapDispatch
)(QuitLink)

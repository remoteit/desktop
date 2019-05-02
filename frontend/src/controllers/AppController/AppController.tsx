import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { App } from '../../components/App'

export type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  loginStarted: state.auth.loginStarted,
})
const mapDispatch = (dispatch: any) => ({
  checkLogin: dispatch.auth.checkLogin,
})

export const AppController = connect(
  mapState,
  mapDispatch
)(App)

// componentDidMount() {
//   this.setState({ checkingLogin: true })
//   checkLogin()
//     .then(user => this.setState({ user }))
//     .catch(error => this.setState({ error }))
//     .finally(() => this.setState({ checkingLogin: false }))
// }

// const [{ auth }, dispatch] = useStore()

// useEffect(() => {
//   async function loginStart() {
//     dispatch({ type: actions.auth.loginStart })

//     const user = await User.loginStart()

//     // Do nothing if we didn't get a user back
//     if (!user) return

//     // Store user info and send them to the homepage
//     dispatch({ type: actions.auth.login, user })
//     dispatch({ type: actions.auth.loginStopped })
//     // navigate('/', true)
//   }

//   function subscribe() {
//   socket.on(
//     'service/connected',
//     (message: ConnectdMessage) => {
//       console.log('CONNECTED:', message)
//       if (message.serviceID === service.id) {
//         // TODO: Update device and service in store with connected state
//         dispatch({
//           type: actions.devices.connected,
//           service,
//           port: message.port,
//         })
//         setConnecting(false)
//         setConnected(true)
//       }
//     }
//   }

//   loginStart()
//   subscribe()

//   return () => {
//     socket.off('service/connected')
//   }
// }, [])

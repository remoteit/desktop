import { connect } from 'react-redux'
import { ApplicationState } from '../../store'
import { App } from '../../components/App'

export type Props = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>

const mapState = (state: ApplicationState) => ({
  signInStarted: state.auth.signInStarted,
  user: state.auth.user,
})
const mapDispatch = (dispatch: any) => ({
  checkSignIn: dispatch.auth.checkSignIn,
})

export const AppController = connect(
  mapState,
  mapDispatch
)(App)

// componentDidMount() {
//   this.setState({ checkingsignIn: true })
//   checkSignIn()
//     .then(user => this.setState({ user }))
//     .catch(error => this.setState({ error }))
//     .finally(() => this.setState({ checkingsignIn: false }))
// }

// const [{ auth }, dispatch] = useStore()

// useEffect(() => {
//   async function signInStart() {
//     dispatch({ type: actions.auth.signInStart })

//     const user = await User.signInStart()

//     // Do nothing if we didn't get a user back
//     if (!user) return

//     // Store user info and send them to the homepage
//     dispatch({ type: actions.auth.signIn, user })
//     dispatch({ type: actions.auth.signInStopped })
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

//   signInStart()
//   subscribe()

//   return () => {
//     socket.off('service/connected')
//   }
// }, [])

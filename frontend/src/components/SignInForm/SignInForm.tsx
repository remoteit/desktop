import { CLIENT_ID, API_URL, DEVELOPER_KEY } from '../../shared/constants'
import theme from '../../styling/theme'
import React from 'react'
// import useFormal from '@kevinwolf/formal-web'
// import { makeStyles } from '@material-ui/core/styles'
// import { Button, TextField, Link } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
// import styles from '../../styling'
// import * as yup from 'yup'
import { CognitoAuth } from '@remote.it/components'

// export function SignInForm(handleSignInSuccess : any ) {
//   return <CognitoAuth onSignInSuccess={handleSignInSuccess} />
// }

export function SignInForm() {
  // const css = useStyles()
  // const { signInError, signInStarted } = useSelector((state: ApplicationState) => state.auth)
  const { auth } = useDispatch<Dispatch>()
  // return null
  return (
    <CognitoAuth
      themeOverride={theme}
      onSignInSuccess={auth.handleSignInSuccess}
      showLogo={false}
      clientId={CLIENT_ID}
      apiURL={API_URL}
      developerKey={DEVELOPER_KEY}
    />
  )
}

// const schema = yup.object().shape({
//   username: yup
//     .string()
//     // .email()
//     .required(),
//   password: yup.string().min(7).max(64).required(),
// })

// const initialValues = {
//   password: '',
//   username: '',
// }

// export function SignInForm() {
//   const css = useStyles()
//   const { signInError, signInStarted } = useSelector((state: ApplicationState) => state.auth)
//   const { auth } = useDispatch<Dispatch>()
//   const formal = useFormal(initialValues, {
//     schema,
//     onSubmit: ({ password, username }: { password: string; username: string }) => {
//       auth.signIn({ username: username.toLowerCase(), password })
//     },
//   })

//   const usernameProps = formal.getFieldProps('username')
//   const passwordProps = formal.getFieldProps('password')
//   return (
//     <form className={css.form} {...formal.getFormProps()}>
//       {signInError && <div className={css.error}>{signInError}</div>}
//       <div className={css.section}>
//         <TextField
//           {...{ ...usernameProps, error: Boolean(usernameProps.error) }}
//           autoFocus
//           fullWidth
//           variant="filled"
//           id="user-username"
//           label="Email or Username"
//           margin="normal"
//           // type="email"
//           // variant="filled"
//         />
//         {formal.errors.username && <span className={css.fieldError}>{formal.errors.username}</span>}
//       </div>
//       <div className={css.section}>
//         <TextField
//           {...{ ...passwordProps, error: Boolean(passwordProps.error) }}
//           fullWidth
//           variant="filled"
//           id="user-password"
//           label="Password"
//           margin="normal"
//           type="password"
//         />
//         {formal.errors.password && <span className={css.fieldError}>{formal.errors.password}</span>}
//       </div>
//       <div className={css.signIn}>
//         <Button
//           {...formal.getSubmitButtonProps()}
//           color="primary"
//           variant="contained"
//           disabled={signInStarted}
//           type="submit"
//         >
//           {signInStarted ? 'Signing in...' : 'Sign in'}
//         </Button>
//         <div className={css.links}>
//           <Link href="https://app.remote.it/auth/#/sign-up" target="_blank">
//             Create an account
//           </Link>
//           <br />
//           <Link href="https://app.remote.it/auth/#/forgot-password" target="_blank">
//             Forgot password
//           </Link>
//         </div>
//       </div>
//     </form>
//   )
// }

// const useStyles = makeStyles({
//   form: {
//     width: 400,
//   },
//   error: {
//     backgroundColor: styles.colors.danger,
//     padding: `${styles.spacing.sm}px ${styles.spacing.md}px`,
//     marginBottom: styles.spacing.md,
//     color: styles.colors.white,
//   },
//   section: {
//     marginBottom: styles.spacing.sm,
//   },
//   fieldError: {
//     color: styles.colors.danger,
//     fontSize: styles.fontSizes.sm,
//   },
//   signIn: {
//     marginTop: styles.spacing.xl,
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   links: {
//     marginLeft: styles.spacing.lg,
//     lineHeight: '1.7em',
//     textAlign: 'center',
//   },
// })

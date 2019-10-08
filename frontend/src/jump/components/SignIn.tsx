import React, { useState, useEffect } from 'react'
import { IInterface } from '../common/types'
import { IUser } from 'remote.it'
import { TextField, Button, CircularProgress, Typography } from '@material-ui/core'
import { DoneRounded } from '@material-ui/icons'
import { makeStyles } from '@material-ui/styles'
import Header from './Header'
import styles from '../styling/styling'

interface Props {
  user: IUser
  interfaces: IInterface[]
  onSignIn: (user: IUser) => void
}
/* 
  try to signIn and if fail delete authHash and continue
*/
const SignIn: React.FC<Props> = ({ user, onSignIn, interfaces, children }) => {
  const css = useStyles()
  const [state, setUser] = useState<IUser>(user)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (user.authHash) setLoading(false)
  }, [user])

  if (user.authHash) return <>{children}</>

  return (
    <div className={css.root}>
      <Header user={user} interfaces={interfaces} />
      {/* <h2>Sign in</h2> */}
      <section>
        <TextField
          label="Email / Username"
          className={css.input}
          disabled={loading}
          value={state.username || ''}
          onChange={event => setUser({ ...state, username: event.target.value })}
          onFocus={event => event.target.select()}
        />
        {/* <TextField
          label="Password"
          className={css.input}
          disabled={loading}
          type="password"
          value={state.password || ''}
          onChange={event => setUser({ ...state, password: event.target.value })}
          onFocus={event => event.target.select()}
        />
        <Button
          color="primary"
          variant="contained"
          className={css.signIn}
          onClick={() => {
            onSignIn(state)
            setLoading(true)
          }}
          disabled={loading || !(state.username && state.password)}
        >
          {loading ? 'SignIng in...' : 'Sign in'}
          {loading ? (
            <CircularProgress className={css.loading} size={styles.fontSizes.lg} />
          ) : (
            <DoneRounded />
          )}
        </Button> */}
        <Typography variant="caption" className={css.signUp}>
          Don't have an account yet? &nbsp;
          <a href="https://app.remote.it/auth/#/sign-up">Sign up for free!</a>
        </Typography>
      </section>
    </div>
  )
}

export default SignIn

const useStyles = makeStyles({
  root: {
    height: '100%',
    padding: `${styles.page.marginVertical}px ${styles.page.marginHorizontal}px`,
    '& section': {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    '& a': {
      color: styles.colors.primary,
    },
  },
  input: {
    width: 300,
    marginTop: styles.spacing.lg,
  },
  loading: {
    color: styles.colors.gray,
    marginLeft: styles.spacing.md,
  },
  signIn: {
    width: 300,
    marginRight: 0,
    marginTop: styles.spacing.xl,
  },
  signUp: {
    marginTop: styles.spacing.xl,
    color: styles.colors.grayLight,
  },
})

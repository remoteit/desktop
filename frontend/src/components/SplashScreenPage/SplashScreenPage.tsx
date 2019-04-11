import React, { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { navigate } from 'hookrouter'
// import styles from './SplashScreenPage.module.css'

export interface Props {}

export function SplashScreenPage({ ...props }: Props) {
  const [{ initializing, user }, dispatch] = useStore()

  useEffect(() => {
    setTimeout(() => dispatch({ type: 'INITIALIZED' }), 800)
  }, [])

  // useEffect(() => {
  //   setTimeout(
  //     () =>
  //       dispatch({
  //         type: 'LOGIN',
  //         user: {
  //           email: 'foo@bar.com',
  //           token: '...',
  //           apiKey: '',
  //           authHash: '',
  //           id: '...',
  //           language: 'en',
  //           pubSubChannel: '...',
  //           username: '...',
  //         },
  //       }),
  //     500
  //   )
  // }, [])

  if (initializing) return <h1>Starting up...</h1>

  if (!user) {
    navigate('/sign-in')
    return <h1>Nope!</h1>
  }

  return <p {...props}>Logged in!</p>
}

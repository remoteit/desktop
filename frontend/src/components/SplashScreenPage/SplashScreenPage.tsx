import React, { useState } from 'react'
import { useStore } from '../../store'
// import styles from './SplashScreenPage.module.css'

export interface Props {}

export function SplashScreenPage({ ...props }: Props) {
  const [store, dispatch] = useStore()
  if (store.initializing) return <h1>Starting up...</h1>
  return <p {...props}>SplashScreenPage</p>
}

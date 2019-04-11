import React from 'react'
import Typography from '@material-ui/core/Typography'
import { useTitle } from 'hookrouter'
// import styles from './NotFoundPage.module.css'

export interface Props {}

export function NotFoundPage({ ...props }: Props) {
  useTitle('Page Not Found')
  return (
    <>
      <Typography component="h2" variant="h1" gutterBottom>
        Page Not Found
      </Typography>
    </>
  )
}

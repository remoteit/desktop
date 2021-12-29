import React, { useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'
import { ChangePassword } from '../components/ChangePassword'

export const SecurityPage: React.FC = () => {

  useEffect(() => {
    analyticsHelper.page('SecurityPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Security & Login</Title>

          </Typography>
          <ChangePassword />

        </>
      }
    >

    </Container>
  )
}

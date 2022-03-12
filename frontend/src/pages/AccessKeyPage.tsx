import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { Typography, Divider } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { DataCopy } from '../components/DataCopy'
import { AccountAccessKey } from '../components/AccountAccessKey'
import { Gutters } from '../components/Gutters'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccessKeyPage: React.FC = () => {
  const { apiKey } = useSelector((state: ApplicationState) => ({
    apiKey: state.keys?.apiKey,
  }))

  useEffect(() => {
    analyticsHelper.page('AccessKeyPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Access Keys</Title>
          </Typography>
        </>
      }
    >
      <AccountAccessKey />
      <Divider variant="inset" />
      <Typography variant="subtitle1">Developer</Typography>
      <Gutters bottom="xl">
        <Typography variant="body2" gutterBottom>
          This is your unique Developer API key to use and access remote.it APIs.
          <br />
          <em>Do not share it with anyone.</em>
        </Typography>
        <DataCopy showBackground value={apiKey} label="API Key" />
      </Gutters>
    </Container>
  )
}

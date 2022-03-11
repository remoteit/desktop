import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { Typography, Divider, makeStyles } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { DataCopy } from '../components/DataCopy'
import { AccountAccessKey } from '../components/AccountAccessKey'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccessKeyPage: React.FC = () => {
  const { apiKey } = useSelector((state: ApplicationState) => ({
    apiKey: state.accounts?.apiKey,
  }))
  const css = useStyles()

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
      <Notice gutterTop severity="warning">
        @benoit what is the difference between these keys?
      </Notice>
      <Typography variant="subtitle1">Developer</Typography>
      <Gutters bottom="xl">
        <Typography variant="body2" gutterBottom>
          This is your unique Developer API key to use and access remote.it APIs.
          <br />
          <em>Do not share it with anyone.</em>
        </Typography>
        <DataCopy showBackground value={apiKey} label="API Key" />
      </Gutters>
      <Divider variant="inset" />
      <AccountAccessKey />
    </Container>
  )
}

const useStyles = makeStyles({
  padding: {
    paddingLeft: spacing.sm,
    margin: '0px',
  },
  titlePadding: {
    paddingLeft: '33px',
  },
})

import React from 'react'
import { State } from '../store'
import { Typography, Divider } from '@mui/material'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { CopyCodeBlock } from '../components/CopyCodeBlock'
import { AccountAccessKey } from '../components/AccountAccessKey'
import { Gutters } from '../components/Gutters'

export const AccessKeyPage: React.FC = () => {
  const { apiKey } = useSelector((state: State) => ({
    apiKey: state.keys?.apiKey,
  }))

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
          This is your unique Developer API key to use and access Remote.It APIs.
          <br />
          <em>Do not share it with anyone.</em>
        </Typography>
        <CopyCodeBlock label="API Key" value={apiKey} hideCopyLabel />
      </Gutters>
    </Container>
  )
}

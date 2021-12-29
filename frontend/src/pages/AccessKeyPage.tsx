import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { Typography, List, ListItem, Box } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'
import { CopyButton } from '../buttons/CopyButton'
import { AccountAccessKey } from '../components/AccountAccessKey'
import { Grid } from '@material-ui/core'

export const AccessKeyPage: React.FC = () => {
  const { apiKey } = useSelector((state: ApplicationState) => ({
    apiKey: state.accounts?.apiKey,
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
          <Typography variant="subtitle1">Developer api key</Typography>
          <List>
            <ListItem>
              <Typography variant="body1">
                This is your unique Developer API key to use and access remote.it APIs.
                <br></br>
                <em>Do not share it with anyone.</em>
              </Typography>
            </ListItem>
            <ListItem>
              <Box mt={4}>
                <Grid container>
                  <Grid item >
                    <Box borderRadius={3} p={1} bgcolor="#F0F0F0">
                      <Typography variant="caption" >{apiKey}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={1} md={1}>
                    <CopyButton value={apiKey} icon='copy' />
                  </Grid>
                </Grid>
              </Box>
            </ListItem>
          </List>
          <AccountAccessKey />
        </>
      }
    >

    </Container>
  )
}

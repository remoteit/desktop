import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { Typography, List, ListItem, Box, makeStyles } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'
import { CopyButton } from '../buttons/CopyButton'
import { AccountAccessKey } from '../components/AccountAccessKey'
import { Grid } from '@material-ui/core'
import { spacing } from '../styling'
import { Gutters } from '../components/Gutters'

const useStyles = makeStyles({
  padding: {
    paddingLeft: spacing.sm,
    margin: '0px'
  },
  titlePadding: {
    paddingLeft: '33px'
  }
})

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
      <Typography variant="subtitle1" className={css.titlePadding}>Developer api key</Typography>
      <Gutters className={css.padding}>
        <List>
          <ListItem>
            <Typography variant="body2">
              This is your unique Developer API key to use and access remote.it APIs.
              <br></br>
              <em>Do not share it with anyone.</em>
            </Typography>
          </ListItem>
          <ListItem>
            <Box mt={4}>
              <Grid container>
                <Grid item>
                  <Box borderRadius={3} p={1} bgcolor="#F0F0F0">
                    <Typography variant="h4">{apiKey}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={1} md={1}>
                  <CopyButton value={apiKey} icon="copy" />
                </Grid>
              </Grid>
            </Box>
          </ListItem>
        </List>
      </Gutters>
      <AccountAccessKey />
    </Container>
  )
}

import React from 'react'
import { Box, Button, Grid, makeStyles, MenuItem, TextField, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { Avatar } from '../../components/Avatar'
import { colors } from '../../styling'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

export const Profile = () => {
  const { user } = useSelector((state: ApplicationState) => state.auth )
  
  const css = useStyles()

  return (
    <Section title="Profile">
      
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
            User Profile
        </Typography>
      </Box>
      <Box mt={4}>
          <Grid container>  
            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Email
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {user?.email}
                </Typography>
              </Box>
            </Grid>
          </Grid>
      </Box>

      <Box mt={0}>
          <Grid container>  
            <Grid item xs={12} md={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Profile Picture
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box>
                  <Avatar size={50}></Avatar>
                  <Typography variant="subtitle2" gutterBottom>
                    <a href='#'> Change Password</a>
                  </Typography>
              </Box>
            </Grid>
          </Grid>
      </Box>

      <Box mt={0}>
          <Grid container>  
            <Grid item xs={12} md={2}>
              <Box mt={1}>
                <Typography variant="subtitle2" gutterBottom>
                    Email Language
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box>
                <TextField id="select" variant="outlined" size="small" value="10" select style={{ width: 235 }}>
                  <MenuItem value="10">English</MenuItem>
                </TextField>
              </Box>
            </Grid>
          </Grid>
      </Box>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
            Delete Account
        </Typography>
        <Box pr={2}>
          <Typography variant="body2">
            If you no longer want/need your remote.it account, 
            you can request an account deletion. Once your delete request is processed, 
            all your account information is removed permanently.
          </Typography>
        </Box>
        <Box mt={4}>
          <Button variant="outlined" className={css.buttonDanger} >
            Delete Account
          </Button>
        </Box>
        <Box mt={2}>
          <Typography variant='caption'>
            <i>Deletion requests take 3-5 days to complete.</i>
          </Typography>
        </Box>
      </Box>
     

    </Section>
  )
}

const useStyles = makeStyles({
 buttonDanger: {
   color: colors.dangerLight,
   borderColor: colors.dangerLight,
 }
})

import React from 'react'
import { Box, Grid, makeStyles, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { Icon } from '../../components/Icon'
import { SaveButton } from '../../buttons/SaveButton'

export const AccessKey = () => {
  

  return (
    <Section title="Access Keys">
      <Box mt={4}>

        <Typography variant="h5" gutterBottom>
            Developer API Key
        </Typography>
        <Box mt={4}>
          <Typography variant="body2">
              This is your unique Developer API Key to use and access remote.it.<br/>
              <i>Do not share it with anyone.</i>
          </Typography>
        </Box>

        <Box mt={4}>
          <Grid container>
            <Grid item xs={3} md={3}>
              <Box borderRadius={3} p={1} bgcolor="#F0F0F0">
                <Typography variant="caption" >ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890</Typography>
              </Box>
            </Grid>
            <Grid item xs={1} md={1}>
              <Box ml={1} pt={1}><Icon name="copy" size="md" color="#757575" /></Box>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="h5" gutterBottom>
            Access Key
        </Typography>
        <Box mt={4}>
          <Grid container>
            <Grid item md={8} xs={8}>
              <Typography variant="body2">
                Access keys are used to authenticate you with our API. You can create a new key or delete an existing key at any time. You can also temporarily disable a key.
                <br/> 
                <i>If you lose or forget your secret key, you cannot retreive it. There is a limit of 2 access keys.</i>
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box mt={5}>
          <SaveButton label="CREATE ACCESS KEY"  onClick={()=> {}}/>
        </Box>

      </Box>
      
    </Section>
  )
}



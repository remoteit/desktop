import React from 'react'
import { Box, Grid, MenuItem, TextField, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { Icon } from '../../components/Icon'
import { Payment } from '../../components/Payment'

export const SwitchPlans = () => {
  

  return (
    <Section title="Switch to Plan: “Business”">
      <Box mt={4}>

        <Typography variant="h5" gutterBottom>
            Plan Configuration
        </Typography>

        <Box mt={3}>
          <Grid container>
            <Grid item xs={3} md={3}>
              <Typography variant="caption">
                DEVICE LICENSES
              </Typography>
              <Box>
                <TextField id="select" variant="outlined" size="small" value="10" select style={{ width: 243 }}>
                  <MenuItem value="10">26-1500 devices</MenuItem>
                </TextField>
              </Box>
            </Grid>
            <Grid item xs={1} md={1}>
              <Box mt={4}>
                <Icon name="question-circle" size="md" />
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box mt={3} mb={5}>
          <Grid container>
            <Grid item xs={4} md={4}>
              <Typography variant="subtitle2">
                PRICE
              </Typography>
              <Box>
                <Typography variant="h6">$50/month</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Payment />

      </Box>
    </Section>
  )
}

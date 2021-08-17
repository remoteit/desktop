import React from 'react'
import { Box, Grid, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { Avatar } from '../../components/Avatar'
import { PaperPlan } from '../../components/PaperPlan'
import { ListItemPlan } from '../../components/PaperPlan/ListItemPlan'
import { EditButton } from '../../buttons/EditButton'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

export const Overview = () => {

  const { user } = useSelector((state: ApplicationState) => state.auth )
  
  return (
    <Section title="Overview">
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
              </Box>
            </Grid>
          </Grid>
      </Box>

      <Box mt={3}>
          <Grid container>  
            <Grid item xs={12} md={2}>
              <Box mt={0}>
                <Typography variant="subtitle2" gutterBottom>
                    Email Language
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="body1">English</Typography>
              </Box>
            </Grid>
          </Grid>
      </Box>

     <EditButton label="EDIT PROFILE" />

      <Box mt={6}>
        <Typography variant="h5" gutterBottom>
            Current remote.it Plan
        </Typography>
      </Box>
      
      <Box mb={3}>
          <PaperPlan 
            name='free'
            planName="Personal"
            leftSubtitle="For home/personal use"
            quantity={0}
            rightSubtitle="No charge"
            headerDivider={true}
            actualPlan={true}
          >
          <ListItemPlan />
        </PaperPlan>
      </Box>

      <EditButton label="EDIT PLAN" />
    </Section>
  )
}


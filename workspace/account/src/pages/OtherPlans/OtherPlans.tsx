import React from 'react'
import { Box, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, makeStyles, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { PaperPlan } from '../../components/PaperPlan'
import { ProgressBar } from '../../components/ProgressBar'
import { Icon } from '../../components/Icon'

export const OtherPlans = () => {
  
  const css = useStyles()

  return (
    <Section title="Other Plans">
      <Box mt={4}>
       
        <PaperPlan
          name=''
          planName="AWS 20 Devices Plan"
          leftSubtitle="Up to 20 AWS services"
          quantity={0}
          rightSubtitle="Monday, June 1, 2021"
          headerDivider={false}
          actualPlan={false}
          managePlans={true}
          >
          <Box mt={2}>
            <Divider />
          </Box>
          <ProgressBar value={50} description="10 of 20 AWS services" />
          <Box mt={2} >
            <Divider />
          </Box>
          <Box mt={2}>
            <Grid container>
              <Grid item xs={4} md={4}>
                <Box pt={1}>
                  <Typography variant="subtitle2" >License Key</Typography>
                </Box>
              </Grid>
              <Grid item xs={8} md={8}>
                <Box pt={1}>
                  <List className={css.noSides}>
                    <ListItem className={css.noSides}>
                      <ListItemIcon className={css.noSides}>
                        <Icon name="copy" size="md"></Icon>
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">a12b3c45-1d23-12a3-bce4-123a19e604ee</Typography>} />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box mt={2} mb={3}>
            <Divider/>
          </Box>
        </PaperPlan>
      </Box>

    </Section>
  )
}

const useStyles = makeStyles({
  noSides : {
    padding: 0,
    margin:0
  }
})

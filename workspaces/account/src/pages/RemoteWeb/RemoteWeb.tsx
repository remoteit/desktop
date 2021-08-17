import React from 'react'
import { Box, Grid, List, ListItem, ListItemText, makeStyles, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { DownloadButton } from '../../buttons/DownloadButton'

export const RemoteWeb = () => {
  
  const css = useStyles()

  return (
    <Section title="Have you tried our desktop application?" center={true}>
      <Box mt={4}>
        <Grid container>
          <Grid item xs={6} md={6}>
            <div style={{ width:328, height:214, backgroundColor: '#DDDDD'}}></div>
          </Grid>
          <Grid item xs={6} md={6}>
            <Box mb={2}>
              <Typography variant="h6">You might be missing out on features only available in our desktop application:</Typography>
            </Box>
            <Box>
                <List>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• On-demand connections</Typography>}/>
                    </ListItem>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• Peer-to-peer connections</Typography>}/>
                    </ListItem>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• Persistent URLs</Typography>}/>
                    </ListItem>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• Enable remote access</Typography>}/>
                    </ListItem>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• Share and access device lists</Typography>}/>
                    </ListItem>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• Advanced search and filters</Typography>}/>
                    </ListItem>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• System notifications</Typography>}/>
                    </ListItem>
                    <ListItem className={css.listItem}>
                      <ListItemText primary={<Typography variant="body2">• See the full list</Typography>}/>
                    </ListItem>
                </List>
            </Box>
          </Grid>
          <Grid xs={12} md={12} >
            <div style={{ width: '100%', textAlign: 'center'}}>
              <Box component="div"  display="inline">
                  <DownloadButton label="Download" />
              </Box>
              <Box component="div" display="inline" ml={2}>
                <Typography variant="caption">or <a href="#">continue to remote.it for Web</a></Typography>
              </Box>
            </div>
          </Grid>
        </Grid>
      </Box>
      <Box mt={4} justifyContent='center'>

      </Box>

    </Section>
  )
}

const useStyles = makeStyles({
  listItem: {
    padding: 0,
    margin: 0
  }
})

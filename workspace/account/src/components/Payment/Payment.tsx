import { Box, Divider, Grid, MenuItem, TextField, Typography } from '@material-ui/core'
import React from 'react'
import { CancelButton } from '../../buttons/CancelButton'
import { SaveButton } from '../../buttons/SaveButton'

export const Payment = (): JSX.Element => {
    return (
      <>
      <Box mt={2}>
          <Typography variant="h5" gutterBottom>
              Payment
          </Typography>
        </Box>
        <Box mt={0}>
          <Grid container>
            <Grid item xs={4} md={4}>
              <Typography variant="caption" >
                PAYMENT METHOD
              </Typography>
              <Box>
                <TextField id="select" variant="outlined" size="small" value="10" select style={{ width: 243 }}>
                  <MenuItem value="10">AMEX ending in 6789</MenuItem>
                </TextField>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box mt={2}>
          { true && (
            <Grid container >
              <Grid item xs={9} md={9}>
                <Box bgcolor="#F0F0F0" borderRadius={3} p={3}>
                  <Grid container>
                    <Grid item xs={12} md={5} spacing={1}>
                      <Typography variant="caption" style={{ fontWeight: 700 , fontSize: 10}}>CARD NUMBER</Typography><br/>
                      <TextField size="small" variant="outlined" style={{ width: '100%', backgroundColor: 'white' }}/>
                    </Grid>
                    <Grid item xs={12} md={6} spacing={1}>
                      <Box ml={1}>
                        <Typography variant="caption" style={{ fontWeight: 700, fontSize: 10 }}>EXPIRATION DATE</Typography><br/>
                        <div style={{ width: '100%'}}>
                          <Box display="inline" >
                            <TextField size="small" value="10" select variant="outlined" style={{ width: 75, backgroundColor: 'white' }}>
                              <MenuItem value="10">01</MenuItem>
                            </TextField>
                          </Box>
                          <Box display="inline" ml={1}>
                            <TextField size="small" value="10"  select variant="outlined" style={{ width: 86, backgroundColor: 'white' }}>
                              <MenuItem value="10">2021</MenuItem>
                            </TextField>
                          </Box>
                        </div>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>

        <Grid container>
          <Grid item xs={9} md={9}>
            <Box mt={4} mb={3} >
              <Divider />
            </Box>
          </Grid>
        </Grid>
        
        <div style={{ width: '100%' }}>
          <Box component="div" display="inline" >
            <SaveButton label="CONFIRM" onClick={() => {}}/>
          </Box>
          <Box component="div" display="inline" >
            <CancelButton label="CANCEL" />
          </Box>
        </div>
      </>
    )
  }


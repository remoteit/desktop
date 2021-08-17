
import React from 'react'
import { makeStyles,  Avatar as MuiAvatar, Box, Paper, Grid, Typography, Divider } from '@material-ui/core'
import { ProgressBar } from '../ProgressBar'
import { PlanForm } from '../planForm'

export interface Props {
  name: string
  planName: string
  leftSubtitle?: string
  quantity: number
  rightSubtitle?: string
  headerDivider?: boolean
  children?: any
  actualPlan?: boolean
  managePlans?: boolean
}

export const PaperPlan : React.FC<Props> = ( { 
  name,
  planName,
  leftSubtitle,
  quantity,
  rightSubtitle,
  headerDivider,
  children,
  actualPlan,
  managePlans
 } ) => {
  const css = useStyles()

  const Title = ( orientation: string) => {
    let title = <></>
     orientation === 'left' ? (
      title = planName ? (
        <Box>
          <Typography variant="h6">{planName}</Typography>
        </Box>   
      ) : <></>
     ) : (
      title = quantity ? (
        <Box>
          <Typography variant={ managePlans ? "body2" : "h6" } align="right">${quantity}</Typography>
        </Box>   
      ) : <></>
     )
     return title
  }

  const Subtitle = ( orientation: string) => {
    let title = <></>
     orientation === 'left' ? (
      title = planName ? (
        <Box>
          <Typography variant="body2" >{leftSubtitle}</Typography>
        </Box>   
      ) : <></>
     ) : (
      title = quantity ? (
        <Box>
          <Typography variant="body2" align="right">{rightSubtitle}</Typography>
        </Box>   
      ) : <></>
     )
     return title
  }

  return (
    <>
    <Box mb={4}>
      <Grid container>
        <Grid item md={8} xs={8}>
          <Paper elevation={3} square>
            <Box p={4}>
                <Box>
                  <Grid container>
                    <Grid item md={6} xs={6}>
                      {Title('left')}
                      {Subtitle('left')}
                    </Grid>
                    <Grid item md={6} xs={6}>
                      {Title('right')}
                      {Subtitle('right')}
                    </Grid>
                  </Grid>
                </Box>
                <Box mt={3} mb={3}>
                  { headerDivider && (<Divider />)}
                </Box>
                {children}
                {actualPlan ? (
                  <>
                    <Box mt={2}>
                      <Divider />
                    </Box>
                    <ProgressBar value={0} description="0 of 5 non-commercial licenses used" />
                  </>
                ) : (
                  <>
                    <Box mt={2} mb={2}>
                      <PlanForm initialValue={quantity} planName={planName}  name={name} label={ managePlans ? 'MANAGE PLANS' : 'SELECT PLAN'} />
                      
                    </Box>
                  </>
                )}

            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
    </>
  )
}

const useStyles = makeStyles({
  
})

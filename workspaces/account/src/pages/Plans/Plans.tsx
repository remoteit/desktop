import React from 'react'
import { Box, Typography } from '@material-ui/core'

import { Section } from '../../components/Section'
import { PaperPlan } from '../../components/PaperPlan'
import { ListItemPlan } from '../../components/PaperPlan/ListItemPlan'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'

const infoPersonal = [
  'Up to 5 devices',
  'Prototyping/POC',
  'Device logs for 7 days',
  'Web support',
  'Scripts',
  'APIs',
  'Mobile apps',
  'Non commercial',
]
const infoProf = [
  'All Personal plan features',
  'Up to 25 devices',
  'Device logs for 14 days',
  'Email support',
]
const infoBus = [
  'All Professional plan features',
  'From 1 to 1000’s of devices',
  'Device logs for 30 days',
]

const ITEM_PLAN = [
  { 
    name : 'free',
    planName: 'Personal',
    leftSubtitle: 'For home/personal use',
    quantity: 0,
    rightSubtitle: 'No charge',
    info : infoPersonal
  },
  { 
    name : 'device',
    planName: 'Professional',
    leftSubtitle: 'For home and small businesses',
    quantity: 2,
    rightSubtitle: '/month/device',
    info : infoProf
  },
  { 
    name : 'seat',
    planName: 'Business',
    leftSubtitle: 'For thousands of devices',
    quantity: 50,
    rightSubtitle: '/month for up to 1500 devices',
    info : infoBus
  },
]

export const Plans = () => {

  const { user } = useSelector((state: ApplicationState) => state.auth)
  
  return (
    <Section title="remote.it Plans">
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
            Current Plan
        </Typography>
        {
          ITEM_PLAN.filter( item =>  item.name === user?.plan?.name ).map( item => {
            return (
              <PaperPlan
                name={item.name}
                planName={item.planName}
                leftSubtitle={item.leftSubtitle}
                quantity={item.quantity}
                rightSubtitle={item.rightSubtitle}
                headerDivider={true}
                actualPlan={true}
              >
                <ListItemPlan infoPlan={item.info}/>
              </PaperPlan>
            )
          })
        }
        
      </Box>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
            Available Plans
        </Typography>
        {
          ITEM_PLAN.filter( item =>  item.name !== user?.plan?.name ).map( item => {
          return (
            <PaperPlan
              name={item.name}
              planName={item.planName}
              leftSubtitle={item.leftSubtitle}
              quantity={item.quantity}
              rightSubtitle={item.rightSubtitle}
              headerDivider={false}
              actualPlan={false}
            >
              <ListItemPlan infoPlan={item.info}/>
            </PaperPlan>
          )
          })
        }
      </Box>
      
    </Section>
  )
}


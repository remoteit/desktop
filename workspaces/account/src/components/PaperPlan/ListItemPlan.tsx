import React from 'react'
import { makeStyles, Avatar as MuiAvatar, Box,  Typography, List, ListItemIcon, ListItem, ListItemText } from '@material-ui/core'
import { Icon } from '../Icon'

const  ITEM = [ 
  'Up to 5 devices', 
  'Device list sharing to 2 accounts', 
  'Prototyping/POC',
  'Device logs for 7 days',
  'Web support',
  'Scripts + APIs'
  ]

export interface Props {
  infoPlan?: string[]
}

export const ListItemPlan : React.FC<Props> = ( { 
 infoPlan
 } ) => {
  const css = useStyles()
 
  
  return (
    <>
      <Box>
        <List className={css.list}>
          { infoPlan?.map( (item, index) => {
            return (
              
              <div key={index}>
                <ListItem className={css.item} >
                  <ListItemIcon className={css.icon}>
                    <Icon name="check" size="md" color="#75bd00" ></Icon>
                  </ListItemIcon>
                  <ListItemText className={css.text} primary={<Typography variant="body2">{item}</Typography>} />
                </ListItem>
              </div>
            )
          })}
        </List>
      </Box>
    </>
  )
}

const useStyles = makeStyles({
  list: {
    paddingLeft: 0,
    marginLeft: 0
  },
  icon: {
    minWidth: 30,
    justifyContent: 'left'
  },
  item: {
    padding: 0,
    margin: 0
  },
  text: {
    padding: 0,
    margin: 0
  }
})

import { List, ListItem, ListItemIcon, ListItemText, makeStyles, Typography } from '@material-ui/core'
import React, { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useNavigation } from '../../hooks/useNavigation'
import { spacing } from '../../styling'
import { Icon } from '../Icon'



export const ListItemMenu = (props: { open: boolean }) => {
    const css = useStyles()
    const { LeftMenuItems } = useNavigation()
    const location = useLocation()
    const history = useHistory()
    return (
        <>
            <List className={css.list} style={{borderRadius: props.open ? 3 : 0}}>
                {LeftMenuItems.map((item, index) => {
                    const active = location.pathname === item.path ? true : false 
                    return (
                        <ListItem button 
                            key={index} 
                            className={active ? css.listItemActive : css.listItem} 
                            onClick ={() => history.push(item.path)}
                        >
                            { active && (<div className={ props.open ? css.divider : css.dividerClose }></div>) }
                            <ListItemIcon className={active ? css.active : ''}>
                                <Icon name={item.icon} type="solid" size="md" color={ active ? 'white' : '#BBBBBB'}></Icon>
                            </ListItemIcon>
                            <ListItemText primary={<Typography style={{ fontWeight:500}}>{item.label}</Typography>} />
                        </ListItem>

                    )
                    })} 
            </List>
        </>
    )
}



const useStyles = makeStyles({
   list: {
    backgroundColor: 'rgb(1 10 68)',
    
   },
   listItem : {
    marginLeft: 5,
    marginBottom: 5,
    borderRadius: 0,
    '&:hover': {
        background: "transparent",
     },
    color: '#BBBBBB',
   },
   listItemActive : {
       color: 'white',
       marginLeft: spacing.sm,
       '&:hover': {
            background: "transparent",
        },
   },
   divider: {
       backgroundColor: 'white',
       width: spacing.xxs,
       height: spacing.lg,
       marginRight: 10,
   },
   dividerClose: {
        backgroundColor: 'white',
        width: spacing.xxs,
        height: spacing.lg,
        marginRight: 13,
    },
   active : {
    justifyContent: 'left',
    color: 'white',
    minWidth: 40
   }
});


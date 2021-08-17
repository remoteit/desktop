import { Hidden, List, ListItem, ListItemText, makeStyles, SwipeableDrawer, Typography } from '@material-ui/core'
import React from 'react'
import { useNavigation } from '../../hooks/useNavigation'
import { fontSizes } from '../../styling'



export const ListItemMenuBar = (props: { open: boolean, handleOpen: () => void }) => {
    const css = useStyles()
    const { headerMenuItems } = useNavigation()
      
    const list = (
        <div role="presentation">
                <List className={ !props.open ? css.list : css.listResponsive}>
                    {headerMenuItems.map((item, index) => (
                    <ListItem button key={index}  onClick ={() => window.open(item.path, "_blank")}>
                        <ListItemText primary={
                            <Typography style={{ fontSize: fontSizes.base, fontWeight:500 }}>{item.label}</Typography>} />
                    </ListItem>
                    ))} 
                </List>
            </div>
    )
    return (
        <>
            { !props.open ? (
                <Hidden mdDown>
                    {list}
                </Hidden>
            ) : (
                <Hidden lgUp>
                    <SwipeableDrawer 
                        anchor="top" 
                        open={props.open} 
                        onClose={props.handleOpen}
                        onOpen={props.handleOpen}
                    >
                    {list}
                    </SwipeableDrawer>
                </Hidden>
            )}
        </>
    )
}



const useStyles = makeStyles({
   list: {
    display: 'flex',
    flexDirection: 'row',
    padding: 0,
    width: '40%',
   },
   listResponsive : {
    width: 'auto',
    backgroundColor: '#001246',
    color: 'white'
   }
   
})


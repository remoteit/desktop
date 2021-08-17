import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Drawer } from '@material-ui/core';
import theme from '../../styling/theme';
import { ListItemMenu } from './ListItemMenu';
import clsx from 'clsx';

export const drawerWidth = 240

export const LeftMenu = (props: { fullWidth: boolean; }) => {
  const css = useStyles()
  const [open, setOpen] = React.useState(props.fullWidth);

 
 
  return (
    <>
      <Drawer
          className={clsx(css.drawer, {
            [css.drawerOpen]: open,
            [css.drawerClose]: !open,
          })}
          classes={{
            paper: clsx({
              [css.drawerOpen]: open,
              [css.drawerClose]: !open,
            }),
          }}
          anchor="left"
          variant="permanent"
          open={true}
          onClose={undefined}
        >
        <div className={css.toolbar} ></div>{ open && (<div className={css.toolbar}></div>)}
        <div className={css.drawerContainer}>
          <ListItemMenu open={open}/>
        </div>
      </Drawer>
    </>
  )
  
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: 'nowrap',
      
    },
    toolbar: theme.mixins.toolbar,
    drawerContainer: {
      flexGrow:2,
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: '5%'
    },
    drawerClose: {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
      width: theme.spacing(8) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    },
  })
);


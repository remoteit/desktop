import React, { useState } from 'react'
import { AppBar, Hidden, IconButton, makeStyles , Toolbar  } from '@material-ui/core'
import { spacing } from '../../styling'
import theme from '../../styling/theme'
import { Icon } from '../Icon'
import { ListItemMenuBar } from './ListItemMenuBar'
import { Logo } from '../Logo'
import { Avatar } from '../Avatar'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'


export const NavBar = () => {

  const { user } = useSelector((state: ApplicationState) => state.auth)
  
  const css = useStyles()
  const [open, setOpen] = useState(false)
  const handleOpen = () => {
    setOpen(!open)
  }
 
  return (
    <>
        <AppBar position="fixed" className={css.appBar}>
          <Toolbar className={css.toolbar}>
            <Hidden xsDown>
              <div className={css.logo}>
                  <Logo white={true} width={120} marginTop={3} />
              </div>
            </Hidden>
              <IconButton className={css.menuButton} onClick={handleOpen}>
                <Icon name="bars"></Icon>
              </IconButton>
            <div className={css.menu}>
                <ListItemMenuBar open={open} handleOpen={handleOpen}/>
            </div>
            <div>
              <Avatar email={user?.email} button  /> 
            </div>
          </Toolbar>
        </AppBar>
    </>
  )
}

const useStyles = makeStyles({
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      width:'100%',
      marginBottom: '25%',
      backgroundColor: 'white',
      boxShadow: 'none',
      margin:0,
    },
    toolbar: {
      backgroundColor: 'rgb(1 10 68)',
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('lg')]: {
        display: 'none',
      },
      color: 'white'
    },
    offset: theme.mixins.toolbar,
    menu : {
      flexGrow: 1,
    },
    logo: {
      marginBottom: spacing.md,
      marginLeft: `5%`,
      marginRight: `10%`
    }
  })

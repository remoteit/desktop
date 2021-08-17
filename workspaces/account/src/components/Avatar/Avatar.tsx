import md5 from 'md5'
import React from 'react'
import fallbackImage from './user.png'
import { makeStyles, Avatar as MuiAvatar, Button, Select, MenuItem, Grid, Box } from '@material-ui/core'
import { colors } from '../../styling'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'

export interface Props {
  email?: string
  size?: number
  button?: boolean
  label?: true
}

export const Avatar: React.FC<Props> = ({ email, size = 40, button, label }) => {
  
  const css = useStyles()
  const url = `https://www.gravatar.com/avatar/${md5(email || '')}?s=${size * 2}&d=force-fail`
  const style = { height: size, width: size, backgroundColor: colors.primary }
  const [open, setOpen] = React.useState(false);
  const { auth } = useDispatch<Dispatch>()

  const handleClose = () => {
    setOpen(false)
  }

  const handleOpen = () => {
    setOpen(true)
  }

  const signOut = () => {
    auth.signOut()
  }
  return (
    <>
      <Grid container direction="row" >
        <Grid item  xs={undefined} md={undefined} >
            <span className={label && css.label}>
            <MuiAvatar component="span" className={button ? css.avatar : ''} alt={email} style={style} src={url}>
              <img src={fallbackImage} alt={email} style={style} />
            </MuiAvatar>
            </span>
        </Grid>
        <Grid item xs={undefined} md={undefined}>
            { email && (
              <>
                <Button onClick={handleOpen} className={css.button}>
                    {email}
                </Button>
                <Select
                    labelId="demo-controlled-open-select-label"
                    id="demo-controlled-open-select"
                    open={open}
                    onClose={handleClose}
                    onOpen={handleOpen}
                    onChange={signOut}
                  >
                      <MenuItem value={10}>Sign out</MenuItem>
                  </Select>
              </>
            )}

        </Grid>
      </Grid>
    </>
  )
}

const useStyles = makeStyles({
  label: {
    display: 'flex',
    borderRadius: '50%',
  },
  avatar: {
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: colors.white,
    '&:hover': { borderColor: colors.primaryLight },
  },
  button: {
    color: 'white',
    textTransform: 'lowercase'
  },
})

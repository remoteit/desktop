import React from 'react'
import { makeStyles, Avatar as MuiAvatar, Box, Button } from '@material-ui/core'
import { colors } from '../styling'

export interface Props {
 label: string
 onclick?: () => void
}

export const EditButton : React.FC<Props> = ( { 
  label,
  onclick
 } ) => {
  const css = useStyles()

 
  return (
    <>
       <Box mt={1}>
        <Button variant="outlined" className={css.editButton} onClick={onclick}> {label} </Button>
      </Box>
    </>
  )
}

const useStyles = makeStyles({
  editButton: {
    color: colors.primaryLight,
    borderColor: colors.primaryLight
  },
})

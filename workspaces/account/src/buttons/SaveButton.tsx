import React from 'react'
import { makeStyles, Avatar as MuiAvatar, Box, Button } from '@material-ui/core'
import { colors } from '../styling'

export interface Props {
 label: string
 onClick: () => void
}

export const SaveButton : React.FC<Props> = ( { 
  label, onClick
 } ) => {
  const css = useStyles()

 
  return (
    <>
        <Button variant="contained" color="primary" size="small" onClick={() => onclick} className={css.saveButton}> {label} </Button>
    </>
  )
}

const useStyles = makeStyles({
  saveButton: {
    color: colors.white,
    borderColor: colors.primaryLight,
    fontWeight: 500,
    fontSize: 11,
    borderRadius: 3
  },
})

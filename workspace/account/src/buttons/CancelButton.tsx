import React from 'react'
import { makeStyles, Avatar as MuiAvatar, Box, Button } from '@material-ui/core'
import { colors } from '../styling'

export interface Props {
 label: string
}

export const CancelButton : React.FC<Props> = ( { 
  label
 } ) => {
  const css = useStyles()

 
  return (
    <>
        <Button  color="primary" size="small" className={css.btn}> {label} </Button>
    </>
  )
}

const useStyles = makeStyles({
  btn: {
    fontWeight: 500,
    fontSize: 11,
    borderRadius: 3
  },
})

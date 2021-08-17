import React from 'react'
import { makeStyles, Avatar as MuiAvatar, Button } from '@material-ui/core'
import { colors } from '../styling'
import { Icon } from '../components/Icon'

export interface Props {
 label: string
}

export const DownloadButton : React.FC<Props> = ( { 
  label
 } ) => {
  const css = useStyles()

 
  return (
    <>
        <Button 
          variant="contained" 
          color="secondary" 
          size="small" 
          className={css.downloadButton}
          startIcon={<Icon name="download" size="md"/>}
          > 
            {label} 
        </Button>
    </>
  )
}

const useStyles = makeStyles({
  downloadButton: {
    color: colors.white,
    borderColor: colors.primaryLight,
    fontWeight: 500,
    fontSize: 11,
    borderRadius: 3
  },
})

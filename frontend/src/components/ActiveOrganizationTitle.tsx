import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { makeStyles, ListItem, ListItemText, FormControlLabel } from '@material-ui/core'
import { getOrganization } from '../models/organization'
import { spacing } from '../styling'

export const ActiveOrganizationTitle: React.FC = () => {
  const css = useStyles()

  const { organization } = useSelector((state: ApplicationState) => ({
    organization: getOrganization(state),
  }))

  if (!organization.name) return null

  return (
    <ListItem dense className={css.wrapper}>
      {/* <FormControlLabel>this</FormControlLabel> */}
      <ListItemText primary={organization.name || 'Remote.It'} />
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  wrapper: { marginTop: spacing.md },
}))

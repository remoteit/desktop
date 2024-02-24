import React, { useState } from 'react'
import { Redirect } from 'react-router-dom'
import { REGEX_DOMAIN_SAFE } from '../constants'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import {
  TextField,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import { selectPermissions, selectOrganization, selectLimitsLookup } from '../selectors/organizations'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { SelectSetting } from '../components/SelectSetting'
import { DeleteButton } from '../buttons/DeleteButton'
import { ListItemCopy } from '../components/ListItemCopy'
import { FormDisplay } from '../components/FormDisplay'
import { FileUpload } from '../components/FileUpload'
import { Container } from '../components/Container'
import { ColorChip } from '../components/ColorChip'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { Link } from '../components/Link'

export const ResellerPage: React.FC = () => {
  const { isOrgOwner, organization, limits, permissions } = useSelector((state: State) => {
    const organization = selectOrganization(state)
    return {
      organization,
      isOrgOwner: organization.id === state.auth.user?.id,
      updating: state.organization.updating,
      domain: organization.domain || '',
      defaultDomain: state.auth.user?.email.split('@')[1],
      limits: selectLimitsLookup(state),
      permissions: selectPermissions(state),
    }
  })
  const dispatch = useDispatch<Dispatch>()

  if (!permissions?.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      bodyProps={{ inset: false }}
      header={
        <Typography variant="h1">
          <Title>Reseller</Title>
        </Typography>
      }
    >
      <Typography variant="subtitle1">Customers</Typography>
      <List>
        <InlineTextFieldSetting
          icon="industry-alt"
          value={organization.name}
          label="Organization Name"
          resetValue={organization.name}
          onSave={name => dispatch.organization.setOrganization({ name: name.toString() })}
        />
      </List>
    </Container>
  )
}

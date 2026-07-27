import React from 'react'
import { Redirect, useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { List, ListItemSecondaryAction, Typography, Chip, Box, Button } from '@mui/material'
import { selectPermissions, selectLimitsLookup, selectOrganization } from '../selectors/organizations'
import { State } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { BillingUI } from '../components/BillingUI'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

export const OrganizationRolesPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const { roles, members, limits, permissions } = useSelector((state: State) => ({
    ...selectOrganization(state),
    limits: selectLimitsLookup(state),
    permissions: selectPermissions(state),
  }))

  if (!permissions.includes('ADMIN'))
    return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>{t('organizationRolesPage.roles', 'Roles')}</Title>
          </Typography>
        </>
      }
    >
      {!limits.roles && (
        <Notice severity="info" gutterTop>
          {t('organizationRolesPage.upgradeToBusiness', 'Upgrade your plan to Business to add custom roles.')}
          <BillingUI>
            <Button
              variant="contained"
              size="small"
              onClick={() => history.push('/account/plans')}
              sx={{ display: 'block', marginTop: 1, marginBottom: 1 }}
            >
              {t('organizationRolesPage.upgrade', 'Upgrade')}
            </Button>
          </BillingUI>
        </Notice>
      )}
      <Typography variant="subtitle1">
        <Title>{t('organizationRolesPage.role', 'Role')}</Title>
        {limits.roles && (
          <IconButton
            icon="plus"
            to="/organization/roles/add"
            title={t('organizationRolesPage.addRole', 'Add role')}
            size="md"
          />
        )}
      </Typography>
      <List>
        {roles.map(r => {
          if (r.disabled) return null
          const count = members.filter(m => m.roleId === r.id).length
          return (
            <ListItemLocation
              key={r.id}
              title={
                <Box sx={{ color: r.system ? 'primary.main' : undefined, display: 'flex', alignItems: 'center' }}>
                  {r.system && <Icon name="lock" size="xxxs" type="solid" inlineLeft />}
                  {r.name}
                </Box>
              }
              to={`/organization/roles/${r.id}`}
              exactMatch
              disableIcon
              dense
            >
              <ListItemSecondaryAction>
                <Chip
                  label={
                    count
                      ? t('organizationRolesPage.memberCount', {
                          count,
                          defaultValue_one: '{{count}} member',
                          defaultValue_other: '{{count}} members',
                        })
                      : t('organizationRolesPage.none', 'none')
                  }
                  size="small"
                  onClick={() => history.push('/organization/members')}
                />
              </ListItemSecondaryAction>
            </ListItemLocation>
          )
        })}
      </List>
    </Container>
  )
}

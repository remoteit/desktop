import React from 'react'
import { useTranslation } from 'react-i18next'
import { IPlatformOverrideProps } from '../platforms'
import { Typography, Grid } from '@mui/material'
import { OrganizationIndicator } from '../components/OrganizationIndicator'
import { useAutoRegistration } from '../hooks/useAutoRegistration'
import { Icon, IconProps } from './Icon'
import { RentANodeForm } from './RentANodeForm'

const NodeAttribute = ({ label, ...props }: IconProps & { label: string }) => (
  <Typography variant="caption" color="textSecondary">
    <Icon size="sm" fixedWidth inlineLeft {...props} />
    {label}
  </Typography>
)

export const RentANodeRequest: React.FC<IPlatformOverrideProps> = ({ platform, tags, serviceTypes, oneTimeUse }) => {
  const { t } = useTranslation()
  const { registrationCode } = useAutoRegistration({ platform, tags, serviceTypes, oneTimeUse })
  return (
    <>
      <OrganizationIndicator avatarSize={42} marginBottom={3} display="inline-flex" />
      <Typography variant="body2" color="textSecondary">
        {t('rentANodeRequest.description', "Rent a Symbiote Node from Cachengo's distributed cloud.")}
        <br />
        <em>{t('rentANodeRequest.availability', 'Subject to availability')}</em>
      </Typography>
      <Grid container marginLeft={6} marginBottom={3} maxWidth={266}>
        <Grid item xs={6}>
          <NodeAttribute name="microchip" label={t('rentANodeRequest.cores', '8 ARM cores')} />
        </Grid>
        <Grid item xs={6}>
          <NodeAttribute name="memory" label={t('rentANodeRequest.memory', '16 GB memory')} />
        </Grid>
        <Grid item xs={6}>
          <NodeAttribute name="hard-drive" label={t('rentANodeRequest.storage', '256 GB storage')} />
        </Grid>
        <Grid item xs={6}>
          <NodeAttribute name="ubuntu" type="brands" label={t('rentANodeRequest.os', 'Ubuntu Linux')} />
        </Grid>
      </Grid>
      <RentANodeForm registrationCode={registrationCode} />
    </>
  )
}

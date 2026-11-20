import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material'
import { State, Dispatch } from '../store'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectRemoteitLicense } from '../selectors/organizations'
import { Notice } from './Notice'
import { Icon } from './Icon'

export const CreditCard: React.FC<{ accountId?: string }> = ({ accountId }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { license, updating } = useSelector((state: State) => ({
    license: selectRemoteitLicense(state, accountId ?? state.user.id),
    updating: state.plans.updating,
  }))
  const card = license?.subscription?.card
  const expired = !!card && card.expiration < new Date()
  const update = () => dispatch.plans.updateCreditCard({ last: card?.last, accountId })

  React.useEffect(() => {
    if (!accountId && location.pathname.includes('success')) {
      dispatch.plans.restore()
      history.push('.')
    }
  }, [])

  if (!card && (!accountId || !license?.subscription)) return null

  return (
    <>
      <Typography variant="subtitle1">{t('creditCard.title', 'Credit Card')}</Typography>
      <List>
        {expired && (
          <ListItem>
            <Notice severity="error" gutterTop>
              {t('creditCard.expiredNotice', 'Credit Card Expired.')} <em>{t('creditCard.expiredNoticeDetail', 'Please update your card to continue service.')}</em>
            </Notice>
          </ListItem>
        )}
        <ListItemButton onClick={update} disabled={!!updating}>
          <ListItemIcon>
            <Icon name="credit-card" size="md" />
          </ListItemIcon>
          <ListItemText
            primary={
              card
                ? t('creditCard.cardEndingIn', {
                    brand: card.brand.toUpperCase(),
                    last: card.last,
                    defaultValue: '{{brand}} ending in {{last}}',
                  })
                : t('creditCard.noCard', 'No card on file')
            }
            secondary={
              card &&
              (expired
                ? t('creditCard.expiredDate', { month: card.month, year: card.year, defaultValue: 'Expired {{month}}/{{year}}' })
                : t('creditCard.expiringDate', { month: card.month, year: card.year, defaultValue: 'Expiring {{month}}/{{year}}' }))
            }
          />
          <ListItemSecondaryAction>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={event => {
                event.stopPropagation()
                update()
              }}
              disabled={!!updating}
            >
              {updating ? t('creditCard.processing', 'Processing...') : t('creditCard.update', 'Update')}
            </Button>
          </ListItemSecondaryAction>
        </ListItemButton>
      </List>
    </>
  )
}

import React from 'react'
import { PERSONAL_PLAN_ID, deviceUserTotal } from '../models/plans'
import { Box, Divider, List, ListItem, ListItemSecondaryAction, Typography, Button } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { currencyFormatter } from '../helpers/utilHelper'
import { QuantitySelector } from './QuantitySelector'
import { spacing } from '../styling'
import { Icon } from './Icon'

const listSx = {
  width: '50%',
  minWidth: 400,
  '& .MuiListItem-root': { padding: `${spacing.sm}px` },
  '& h2': { textTransform: 'capitalize' },
}

type Props = {
  plans: IPlan[]
  form: IPurchase
  license: ILicense | null
  onChange: (form: IPurchase) => void
  onCancel: () => void
  onSuccess: () => void
}

export const PlanCheckout: React.FC<Props> = ({ plans, form, license, onChange, onCancel, onSuccess }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const purchasing = useSelector((state: State) => state.plans.purchasing === form.planId)
  const selectedPlan = plans.find(plan => plan.id === form.planId)
  const selectedPrice = selectedPlan?.prices?.find(price => price.id === form.priceId)
  const totals = deviceUserTotal(form.quantity, selectedPlan)

  const setQuantity = (value: string | number) => {
    let quantity = Math.ceil(Math.max(Math.min(+value, 9999), 0))
    if (isNaN(quantity)) quantity = 1
    onChange({ ...form, quantity })
  }

  const setNextInterval = () => {
    const priceArray = selectedPlan?.prices || []
    const next = priceArray.findIndex(p => form.priceId === p.id) + 1
    const index = priceArray.length <= next ? 0 : next
    const priceId = priceArray[index]?.id
    onChange({ ...form, priceId })
  }

  const onSubmit = async () => {
    if (license?.subscription) await dispatch.plans.updateSubscription(form)
    else await dispatch.plans.subscribe(form)
    onSuccess()
  }

  const unchanged = () =>
    form.planId === license?.plan?.id &&
    form.priceId === license?.subscription?.price?.id &&
    form.quantity === (license?.quantity || 1)

  if (form.planId === PERSONAL_PLAN_ID)
    return (
      <>
        <List sx={listSx}>
          <ListItem>
            <Typography variant="h1">{t('planCheckout.personalPlan', 'Personal plan')}</Typography>
          </ListItem>
          <ListItem>
            <Typography variant="body1">
              {t(
                'planCheckout.switchToPersonalConfirm',
                'Are you sure you want to switch to the Personal plan? This will cancel your subscription.'
              )}
            </Typography>
          </ListItem>
        </List>
        <List sx={listSx}>
          <ListItem>
            <Button
              onClick={async () => {
                await dispatch.plans.unsubscribe(form)
                onSuccess()
              }}
              color="primary"
              variant="contained"
              disabled={purchasing}
            >
              {purchasing ? t('planCheckout.processing', 'Processing...') : t('planCheckout.downgrade', 'Downgrade')}
            </Button>
            <Button onClick={onCancel} disabled={purchasing}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </ListItem>
        </List>
      </>
    )

  return (
    <>
      <List sx={listSx}>
        <ListItem>
          <Typography variant="h2">{selectedPlan?.description} plan</Typography>
        </ListItem>
      </List>
      <List sx={listSx}>
        <ListItem onClick={() => setNextInterval()}>
          <Typography variant="h3">{t('planCheckout.interval', 'Interval')}</Typography>
          <ListItemSecondaryAction>
            <Box
              sx={theme => ({
                border: `1px solid ${theme.palette.grayLighter.main}`,
                borderRadius: `${spacing.md}px`,
                backgroundColor: theme.palette.white.main,
                display: 'inline-block',
                '& > .MuiButton-root': { height: 30, borderRadius: 0 },
                '& > .MuiButton-root + .MuiButton-root': { marginLeft: 0 },
                '& > .MuiButton-root:first-of-type': {
                  borderTopLeftRadius: `${spacing.md}px`,
                  borderBottomLeftRadius: `${spacing.md}px`,
                },
                '& > .MuiButton-root:last-child': {
                  borderTopRightRadius: `${spacing.md}px`,
                  borderBottomRightRadius: `${spacing.md}px`,
                },
              })}
            >
              {selectedPlan?.prices?.map(price => (
                <Button
                  key={price.id}
                  size="small"
                  variant={form.priceId === price.id ? 'contained' : undefined}
                  color={form.priceId === price.id ? 'primary' : undefined}
                  onClick={() => onChange({ ...form, priceId: price.id })}
                >
                  {price.interval}
                </Button>
              ))}
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem onClick={() => setQuantity(form.quantity + 1)}>
          <Typography variant="h3">{t('planCheckout.licenses', 'Licenses')}</Typography>
          <ListItemSecondaryAction>
            <QuantitySelector quantity={form.quantity} onChange={setQuantity} />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <Typography variant="h3">{t('planCheckout.users', 'Users')}</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h3" display="flex" alignItems="center" color="grayDarker.main">
              {totals.users}
              <Icon name="user" size="base" type="solid" color="gray" fixedWidth inline />
            </Typography>
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <Typography variant="h3">{t('planCheckout.devices', 'Devices')}</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h3" display="flex" color="grayDarker.main">
              {totals.devices}
              <Icon name="unknown" size="lg" platformIcon inline />
            </Typography>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <List sx={listSx}>
        <Divider />
        <ListItem>
          <Typography variant="h3">{t('planCheckout.total', 'Total')}</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h3">
              {selectedPrice?.amount ? (
                <>
                  {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
                  &nbsp;/&nbsp;
                  {selectedPrice?.interval?.toLowerCase()}
                </>
              ) : (
                <em>{t('planCheckout.free', 'Free')}</em>
              )}
            </Typography>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <List sx={listSx}>
        <ListItem>
          <Button
            onClick={onSubmit}
            color="primary"
            variant="contained"
            disabled={purchasing || unchanged() || !form.quantity}
          >
            {purchasing ? t('planCheckout.processing', 'Processing...') : t('planCheckout.submit', 'Submit')}
          </Button>
          <Button onClick={onCancel} disabled={purchasing}>
            {t('common.cancel', 'Cancel')}
          </Button>
        </ListItem>
      </List>
    </>
  )
}


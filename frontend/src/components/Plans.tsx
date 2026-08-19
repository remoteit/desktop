import React from 'react'
import { useTranslation } from 'react-i18next'
import { Notice } from './Notice'
import { Overlay } from './Overlay'
import { PlanCard } from './PlanCard'
import { PlanGutters } from './PlanGutters'
import { PlanCheckout } from './PlanCheckout'
import { LoadingMessage } from './LoadingMessage'
import { State, Dispatch } from '../store'
import { currencyFormatter } from '../helpers/utilHelper'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { PERSONAL_PLAN_ID, planDetails, deviceUserTotal } from '../models/plans'
import { NoticeCustomPlan } from '../components/NoticeCustomPlan'
import { Confirm } from '../components/Confirm'

type Props = {
  license: ILicense | null
  includeLicenseId?: boolean
  plan?: IPlan
  plans: IPlan[]
}

export const Plans: React.FC<Props> = ({ license, includeLicenseId, plan, plans }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const initialized = useSelector((state: State) => state.organization.initialized)
  const purchasing = useSelector((state: State) => state.plans.purchasing)

  function getDefaults(): IPurchase {
    const price = plan?.prices?.find(p => p.id === license?.subscription?.price?.id) || plan?.prices?.[0]
    return {
      checkout: false,
      planId: plan?.id,
      priceId: price?.id,
      quantity: license?.quantity || 1,
      confirm: false,
      licenseId: includeLicenseId ? license?.id : undefined,
    }
  }
  const [form, setForm] = React.useState<IPurchase>(getDefaults())
  const personal = !license || license.plan.id === PERSONAL_PLAN_ID

  const success = async (push?: boolean) => {
    await dispatch.organization.set({ initialized: false })
    await dispatch.plans.restore()
    setForm(getDefaults())
    if (push) history.push('.')
  }

  React.useEffect(() => {
    if (location.pathname.includes('success')) success(true)
  }, [location.pathname])

  if (!initialized) return <LoadingMessage />

  return (
    <>
      {form.checkout && (
        <Overlay>
          <PlanCheckout
            plans={plans}
            form={form}
            license={license}
            onChange={form => setForm(form)}
            onCancel={() => setForm(getDefaults())}
            onSuccess={success}
          />
        </Overlay>
      )}
      {license?.custom && (
        <PlanGutters>
          <NoticeCustomPlan sx={{ maxWidth: 840 }} fullWidth />
        </PlanGutters>
      )}
      <PlanGutters>
        {plans.map(plan => {
          const totals = deviceUserTotal(license?.quantity || 1, plan)
          const details = plan.id ? planDetails[plan.id] : {}
          const selected = license?.plan?.id === plan.id
          const loading = purchasing === plan.id

          let note = details.note
          let caption = t('plans.perMonthPerLicense', 'per month / per license')
          let planPrice: IPrice | undefined
          let planInterval: string
          let price: string = '-'

          if (plan.prices) {
            planInterval = 'YEAR'
            planPrice = plan.prices.find(p => p.interval === planInterval)
            price = currencyFormatter(planPrice?.currency, (planPrice?.amount || 1) / 12, 0)
            if (!planPrice) {
              planInterval = 'MONTH'
              planPrice = plan.prices.find(p => p.interval === planInterval)
              price = currencyFormatter(planPrice?.currency, planPrice?.amount || 1, 0)
              note = t('plans.billedMonthly', 'billed monthly')
            }
          }

          if (selected && license?.subscription?.total && license?.subscription?.price?.amount) {
            price =
              currencyFormatter(license.subscription.price.currency, license.subscription.total, 0) +
              ` / ${license.subscription.price.interval?.toLowerCase()}`
            caption = t('plans.licenseCount', {
              count: license.quantity || 0,
              defaultValue_one: '{{count}} license',
              defaultValue_other: '{{count}} licenses',
            })
            note = t('plans.usersAndDevices', {
              users: totals.users,
              devices: totals.devices,
              defaultValue: '{{users}} users + {{devices}} devices',
            })
          }

          const result = plan.prices?.find(p => p.id === form.priceId)
          const priceId = result?.id || (plan.prices && plan.prices[0].id)
          const downgradePrice = plan.prices?.find(p => p.interval === license?.subscription?.price?.interval)?.amount
          const isDowngrade = (downgradePrice || 0) < (license?.subscription?.price?.amount || 0)

          return (
            <PlanCard
              key={plan.id}
              name={plan.description}
              description={details.description}
              price={price}
              caption={caption}
              note={note}
              disabled={selected && license?.custom}
              button={selected ? t('plans.update', 'Update') : t('plans.select', 'Select')}
              selected={selected}
              loading={loading}
              onSelect={() =>
                loading
                  ? dispatch.plans.restore()
                  : setForm({
                      ...form,
                      confirm: isDowngrade,
                      checkout: !isDowngrade,
                      planId: plan.id,
                      priceId,
                    })
              }
              features={details.features}
            />
          )
        })}
      </PlanGutters>
      <PlanGutters>
        <PlanCard
          wide
          name={t('plans.personal', 'Personal')}
          description={planDetails[PERSONAL_PLAN_ID].description}
          price="$0"
          caption={t('plans.freePlan', 'Free Plan')}
          button={personal ? t('plans.currentPlan', 'Current Plan') : t('plans.select', 'Select')}
          selected={personal}
          disabled={personal}
          onSelect={() =>
            personal
              ? setForm({ ...form, confirm: false, checkout: true, planId: PERSONAL_PLAN_ID })
              : setForm({ ...form, confirm: true, checkout: false, planId: PERSONAL_PLAN_ID })
          }
          features={planDetails[PERSONAL_PLAN_ID].features}
        />
      </PlanGutters>
      <Confirm
        open={!!form.confirm}
        onConfirm={() => setForm({ ...form, confirm: false, checkout: true })}
        onDeny={() => setForm({ ...form, confirm: false })}
        title={t('plans.downgradePlanTitle', 'Downgrade Plan?')}
        action={t('plans.continue', 'Continue')}
        color="warning"
        maxWidth="xs"
      >
        <Notice severity="warning" fullWidth>
          {t('plans.downgradeNotice', 'This plan will downgrade your service.')}
          <em>
            {t(
              'plans.downgradeNoticeDetail',
              'You will lose access to some features and may lose access to some devices.'
            )}
          </em>
        </Notice>
      </Confirm>
    </>
  )
}


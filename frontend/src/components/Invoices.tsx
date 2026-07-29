import React from 'react'
import { Gutters } from './Gutters'
import { Timestamp } from './Timestamp'
import { Table, TableHead, TableBody, TableRow, TableCell, Tooltip, Typography } from '@mui/material'
import { currencyFormatter } from '../helpers/utilHelper'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { LoadingMessage } from './LoadingMessage'
import { Notice } from './Notice'
import { Link } from './Link'
import { Icon } from './Icon'

export const Invoices: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { invoices, loading } = useSelector((state: State) => state.billing)
  const { t } = useTranslation()

  React.useEffect(() => {
    dispatch.billing.fetch()
  }, [])

  if (!invoices.length && loading) return <LoadingMessage message={t('invoices.loading', 'Loading invoices...')} />

  return (
    <>
      <Typography variant="subtitle1">{t('invoices.title', 'Billing History')}</Typography>
      {!invoices.length && !loading ? (
        <Gutters size="lg">
          <Notice severity="info" fullWidth>
            {t('invoices.empty', 'No invoices found.')}
          </Notice>
        </Gutters>
      ) : (
        <Gutters size="md">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('invoices.date', 'Date')}</TableCell>
                <TableCell>{t('invoices.plan', 'Plan')}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>{t('invoices.amount', 'Amount')}</TableCell>
                <TableCell>{t('invoices.invoice', 'Invoice')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice: IInvoice, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Timestamp date={invoice.created} variant="short" />
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {invoice.plan.name.toLowerCase()} /{' '}
                    {invoice.price.interval ? invoice.price.interval.toLowerCase() : t('invoices.oneTime', 'one-time')}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {currencyFormatter(invoice.price.currency, invoice.total)}
                  </TableCell>
                  <TableCell>
                    {invoice.url && (
                      <Tooltip title={t('invoices.seeInvoice', 'See invoice')}>
                        <Link href={invoice.url}>
                          <Icon name="receipt" />
                        </Link>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Gutters>
      )}
    </>
  )
}


import React from 'react'
import { Gutters } from './Gutters'
import {
  makeStyles,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Typography,
  Link,
} from '@material-ui/core'
import { currencyFormatter } from '../helpers/utilHelper'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { colors, spacing } from '../styling'
import { LoadingMessage } from './LoadingMessage'
import { Icon } from './Icon'

const dateOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  // hour: '2-digit',
  // minute: '2-digit',
}

export const Invoices: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { invoices, loading } = useSelector((state: ApplicationState) => state.billing)

  React.useEffect(() => {
    dispatch.billing.fetch()
  }, [])

  if (!invoices.length && loading) return <LoadingMessage message="Loading invoices..." />

  return (
    <>
      <Typography variant="subtitle1">Billing History</Typography>
      <Gutters size="md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell className={css.amount}>Amount</TableCell>
              <TableCell>Invoice</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice: IInvoice, index) => (
              <TableRow key={index}>
                <TableCell>{invoice.created.toLocaleString(undefined, dateOptions)}</TableCell>
                <TableCell className={css.plan}>
                  {invoice.plan.name.toLowerCase()} / {invoice.price.interval.toLowerCase()}
                </TableCell>
                <TableCell className={invoice.total < 0 ? css.amount : css.amountWithoutColor } >
                  {currencyFormatter(invoice.price.currency, invoice.total)}
                </TableCell>
                <TableCell>
                  {invoice.url && (
                    <Tooltip title="See invoice">
                      <Link href={invoice.url} target="_blank">
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
    </>
  )
}

const useStyles = makeStyles( ({ palette }) => ({
  amount: { 
    paddingRight: spacing.md, 
    textAlign: 'right', 
    color:  palette.danger,
  },
  amountWithoutColor: {
    paddingRight: spacing.md, 
    textAlign: 'right', 
  },
  plan: { textTransform: 'capitalize' },
}))

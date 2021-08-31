import React from 'react'
import { Gutters } from './Gutters'
import { makeStyles, Table, TableHead, TableBody, TableRow, TableCell, Tooltip, Link } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { spacing, fontSizes, colors } from '../styling'
import { selectPlans } from '../models/billing'
import { Icon } from './Icon'

const dateOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

export const Invoices: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { invoices } = useSelector((state: ApplicationState) => ({
    invoices: state.billing.invoices,
  }))

  return (
    <Gutters size="md">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Invoice</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice: IInvoice, index) => (
            <TableRow key={index}>
              <TableCell>{invoice.created.toLocaleString(undefined, dateOptions)}</TableCell>
              <TableCell>{invoice.plan.name}</TableCell>
              <TableCell>
                {(invoice.price.amount / 100).toLocaleString()} {invoice.price.currency} / {invoice.price.interval}
              </TableCell>
              <TableCell>
                <Tooltip title="See invoice">
                  <Link href={invoice.url} target="_blank">
                    <Icon name="receipt" />
                  </Link>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Gutters>
  )
}

const useStyles = makeStyles({})

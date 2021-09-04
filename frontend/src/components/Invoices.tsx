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
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Icon } from './Icon'

const dateOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  // hour: '2-digit',
  // minute: '2-digit',
}

const currencyFormatter = (currency: string, value: number) => {
  return new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
    minimumFractionDigits: 2,
  }).format(value)
}

export const Invoices: React.FC = () => {
  const css = useStyles()
  const { invoices } = useSelector((state: ApplicationState) => state.licensing)

  return (
    <>
      <Typography variant="subtitle1">Billing History</Typography>
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
                <TableCell>
                  {invoice.plan.name} / {invoice.price.interval}
                </TableCell>
                <TableCell>{currencyFormatter(invoice.price.currency, invoice.price.amount / 100)}</TableCell>
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
    </>
  )
}

const useStyles = makeStyles({})

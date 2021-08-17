import React from 'react'
import { makeStyles, Avatar as MuiAvatar, Box, TableContainer, TableHead, TableRow, TableBody, TableCell, Table, Tooltip } from '@material-ui/core'
import { Icon } from '../Icon';




interface Column {
  id: 'createdAt' | 'description' | 'totalInCents' | 'invoiceUrl' 
  label: string
  minWidth?: number
  align?: 'left';
  format?: (value: number) => string;
}

const columns: Column[] = [
  { id: 'createdAt', label: 'Date',  },
  { id: 'description', label: 'Name',  },
  { id: 'totalInCents', label: 'Amount', },
  { id: 'invoiceUrl', label: 'Invoice', },
];





export interface Props {
  transactions?: Transaction[]
  expanded: boolean
}

export const TableTransaction : React.FC<Props> = ( { 
  transactions,
  expanded
 } ) => {
  const css = useStyles()
  
  const recentCount = 10
  const recent = transactions?.slice(0, recentCount)
  const remaining = transactions?.slice(recentCount)
  
  return (
    <>
      <Box>
          <TableContainer  >
            <Table size="small">
              <TableHead>
                <TableRow >
                    {columns.map((column, index) => (
                    <TableCell
                      key={index}
                      align={column.align}
                      className={css.border}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
              {recent?.map((i, key) => (
                <ListItem key={key} transaction={i} />
              ))}
              { expanded &&
                remaining &&
                remaining.length &&
                remaining.map((i, key) => <ListItem key={key} transaction={i} />)}
              {/* {transactions?.map((transaction, index) => <ListItem key={index} transaction={transaction} />)} */}
              </TableBody>
            </Table>
          </TableContainer>
      </Box>
    </>
  )
}

function ListItem({ transaction }: { transaction: Transaction }): JSX.Element {

  const css = useStyles()
  return (
    <TableRow>
      <TableCell className={css.border}>
        <Tooltip title={transaction.createdAt.toISOString()}>
          <span className="gray-dark txt-md c-info">
            {transaction.createdAt.toLocaleString()}
          </span>
        </Tooltip>
      </TableCell>
      <TableCell className={css.border}>
        {transaction.description === 'remot3.it Seat'
          ? 'Business'
          : transaction.description === 'remote.it Device'
          ? 'Professional'
          : 'Personal'}
      </TableCell>
      <TableCell className={css.border}>
        {transaction.totalInCents <= 0 ? (
          'Free'
        ) : (
          <span>
            {(transaction.totalInCents / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: transaction.currency,
            })}{' '}
            <span className="gray">{transaction.currency}</span>
          </span>
        )}
      </TableCell>
      <TableCell className={css.border}>
        <span className="info txt-sm c-info">
          {transaction.invoiceUrl && (
            <a
              href={transaction.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="receipt" />
              &nbsp;View Invoice
            </a>
          )}
        </span>
      </TableCell>
    </TableRow>
  )
}

const useStyles = makeStyles({
  border : {
    borderTop: '1px solid #DDDDDD'
  }
})

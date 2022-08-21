import React from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { createStyles, makeStyles } from '@mui/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import { ApplicationState } from '../../store'
import Paper from '@mui/material/Paper'
import { IAnalyticsDevice } from '../../models/analytics'
import { Color } from '../../styling'
import { Box, Theme } from '@mui/material'
import { Icon } from '../Icon'

export interface ReportDeviceQualityListProps {
  devices: IAnalyticsDevice[]
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    paper: {
      width: '100%',
      marginBottom: theme.spacing(2),
    },
    table: {
      height: 100,
    },
    tableBody: {
      height: 100,
    },
    visuallyHidden: {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: 1,
      margin: -1,
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      top: 20,
      width: 1,
    },
  })
)

let title: string = 'Unknown'
let color: Color = 'gray'
const getQualityDisplay = (device: IAnalyticsDevice) => {
  switch (device.quality) {
    case 'GOOD':
      title = 'Good'
      color = 'success'
      break
    case 'MODERATE':
      title = 'Moderate'
      color = 'warning'
      break
    case 'POOR':
      title = 'Poor'
      color = 'danger'
      break
  }
  return (
    <Box>
      <Icon name="circle" color={color} size="bug" type="solid" inlineLeft /> {title}
    </Box>
  )
}

type Order = 'asc' | 'desc'
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

const headCells = [
  { id: 'name', label: 'Device Name', orderBy: 'name', numeric: false },
  { id: 'quality', label: 'Stability', orderBy: 'qualitySort', numeric: true },
]

interface HeadCell {
  id: keyof IAnalyticsDevice
  label: string
  orderBy: string
  numeric: boolean
}

interface EnhancedTableProps {
  classes: ReturnType<typeof useStyles>
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof IAnalyticsDevice) => void
  order: Order
  orderBy: string
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { classes, order, orderBy, onRequestSort } = props
  const createSortHandler = property => event => {
    onRequestSort(event, property)
  }

  return (
    <TableHead>
      <TableRow>
        {headCells.map(headCell => (
          <TableCell key={headCell.id} sortDirection={orderBy === headCell.orderBy ? order : false}>
            <TableSortLabel
              active={orderBy === headCell.orderBy}
              direction={orderBy === headCell.orderBy ? order : 'asc'}
              onClick={createSortHandler(headCell.orderBy)}
            >
              {headCell.label}
              {orderBy === headCell.orderBy ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
}

export const ReportDeviceQualityList: React.FC = () => {
  const classes = useStyles()
  const [order, setOrder] = React.useState<Order>('asc')
  const [orderBy, setOrderBy] = React.useState<keyof IAnalyticsDevice>('qualitySort')
  const { devices } = useSelector((state: ApplicationState) => state.analytics)

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof IAnalyticsDevice) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }
  const devicesInOrder = devices.slice().sort((a, b) => {
    if (order == 'desc') {
      if (b[orderBy] < a[orderBy]) {
        return -1
      }
      if (b[orderBy] > a[orderBy]) {
        return 1
      }
    } else {
      if (b[orderBy] > a[orderBy]) {
        return -1
      }
      if (b[orderBy] < a[orderBy]) {
        return 1
      }
    }
    return 0
  })
  return (
    <>
      <TableContainer>
        <Table size="small" className={classes.table} aria-label="Device Internet Stability" stickyHeader>
          <EnhancedTableHead classes={classes} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          <TableBody className={classes.tableBody}>
            {devicesInOrder.map(device => {
              const labelId = `enhanced-table-checkbox-${device.id}`
              return (
                <TableRow key={device.id}>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{getQualityDisplay(device)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

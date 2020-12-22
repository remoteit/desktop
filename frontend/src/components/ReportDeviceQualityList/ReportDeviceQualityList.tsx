import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import { ApplicationState } from '../../store'
import Paper from '@material-ui/core/Paper'
import { IAnalyticsDevice } from '../../models/analytics'
import { Color } from '../../styling'
import { Box } from '@material-ui/core'
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
    table: {},
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

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((device, index) => [device, index] as [T, number])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) return order
    return a[1] - b[1]
  })
  return stabilizedThis.map(el => el[0])
}

const headCells = [
  { id: 'name', label: 'Device Name', orderBy: 'name', numeric: false },
  { id: 'quality', label: 'Internet Connectivity', orderBy: 'qualitySort', numeric: true },
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
  })
  return (
    <>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="Device Internet Connectivity">
          <EnhancedTableHead classes={classes} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          <TableBody>
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

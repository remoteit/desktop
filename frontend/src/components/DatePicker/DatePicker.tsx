import React from 'react'
import { DatePicker as MuiDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import { makeStyles, TextField } from '@material-ui/core'
import { getDateFormatString } from '../../helpers/dateHelper'

export const DatePicker: React.FC<{
  onChange: (date: any) => void
  minDay: any
  selectedDate: Date | null
  fetching: boolean
  label: string
}> = ({ onChange, minDay, selectedDate, fetching, label }) => {
  const css = useStyles()
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <MuiDatePicker
        autoOk={true}
        className={css.textField}
        disableToolbar
        variant="inline"
        inputVariant="filled"
        format={getDateFormatString()}
        label={label}
        value={selectedDate || new Date()}
        onChange={onChange}
        disableFuture={true}
        minDate={minDay}
      ></MuiDatePicker>
    </MuiPickersUtilsProvider>
  )
}

const useStyles = makeStyles({
  textField: {
    minWidth: 150,
  },
})

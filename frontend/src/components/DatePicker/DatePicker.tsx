import React from 'react'
import { DatePicker as MuiDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import { getDateFormatString } from '../../helpers/dateHelper'

export const DatePicker: React.FC<{ onChange?: (date: any) => void; minDay: any; selectedDate: Date | null }> = ({
  onChange,
  minDay,
  selectedDate,
}) => {
  if (!onChange) return null
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <MuiDatePicker
        autoOk={true}
        disableToolbar
        variant="inline"
        inputVariant="filled"
        format={getDateFormatString()}
        label="From"
        value={selectedDate}
        onChange={onChange}
        disableFuture={true}
        minDate={minDay}
      ></MuiDatePicker>
    </MuiPickersUtilsProvider>
  )
}

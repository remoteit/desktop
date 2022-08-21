import React, { useState } from 'react'
import { TextField } from '@mui/material'
import { DatePicker as MuiDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { getDateFormatString } from '../../helpers/dateHelper'

export const DatePicker: React.FC<{ onChange?: (date: any) => void; minDay: any; selectedDate: Date | null }> = ({
  onChange,
  minDay,
  selectedDate,
}) => {
  const [open, setOpen] = useState<boolean>(false)
  if (!onChange) return null
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker
        closeOnSelect
        open={open}
        inputFormat={getDateFormatString()}
        renderInput={props => <TextField {...props} label="From" variant="filled" onClick={() => setOpen(true)} />}
        value={selectedDate}
        onChange={onChange}
        onClose={() => setOpen(false)}
        disableFuture={true}
        minDate={minDay}
        disableOpenPicker
      ></MuiDatePicker>
    </LocalizationProvider>
  )
}

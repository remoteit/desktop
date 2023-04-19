import React, { useState } from 'react'
import { TextField } from '@mui/material'
import { DatePicker as MuiDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { getDateFormatString } from '../../helpers/dateHelper'

type Props = {
  minDay?: Date
  selectedDate?: Date
  onChange?: (date: Date | null) => void
}

export const DatePicker: React.FC<Props> = ({ onChange, minDay, selectedDate }) => {
  const [open, setOpen] = useState<boolean>(false)
  if (!onChange) return null
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker
        closeOnSelect
        open={open}
        inputFormat={getDateFormatString()}
        renderInput={props => <TextField {...props} label="From" variant="filled" onClick={() => setOpen(true)} />}
        value={selectedDate || new Date()}
        onChange={onChange}
        onClose={() => setOpen(false)}
        disableFuture={true}
        minDate={minDay}
        disableOpenPicker
      ></MuiDatePicker>
    </LocalizationProvider>
  )
}

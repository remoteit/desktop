import React, { useState } from 'react'
import { DateTime } from 'luxon'
import { TextField } from '@mui/material'
import { DatePicker as MuiDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'
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
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <MuiDatePicker
        closeOnSelect
        open={open}
        inputFormat={getDateFormatString()}
        renderInput={props => <TextField {...props} label="From" variant="filled" onClick={() => setOpen(true)} />}
        value={selectedDate ? DateTime.fromJSDate(selectedDate) : DateTime.now()} // Convert Date to DateTime
        onChange={(date: DateTime | null) => onChange(date?.toJSDate() || null)}
        onClose={() => setOpen(false)}
        disableFuture={true}
        minDate={minDay ? DateTime.fromJSDate(minDay) : undefined}
        disableOpenPicker
      ></MuiDatePicker>
    </LocalizationProvider>
  )
}

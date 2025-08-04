import React from 'react'
import { DateTime } from 'luxon'
import { TextField } from '@mui/material'
import { DatePicker as MuiDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'
import { getDateFormatString } from '../../helpers/dateHelper'
import { Icon } from '../Icon'

type Props = {
  minDay?: Date
  selectedDate?: Date
  onChange?: (date: Date | null) => void
}

export const DatePicker: React.FC<Props> = ({ onChange, minDay, selectedDate }) => {
  if (!onChange) return null

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <MuiDatePicker
        closeOnSelect
        disableFuture
        format={getDateFormatString()}
        slots={{
          textField: TextField,
          openPickerIcon: () => <Icon name="calendar" />,
        }}
        slotProps={{
          textField: { label: 'Ending', variant: 'filled' },
          openPickerButton: { sx: { marginRight: 1 } },
        }}
        value={selectedDate ? DateTime.fromJSDate(selectedDate) : DateTime.now()} // Convert Date to DateTime
        onChange={(date: DateTime | null) => onChange(date?.toJSDate() || null)}
        minDate={minDay ? DateTime.fromJSDate(minDay) : undefined}
      />
    </LocalizationProvider>
  )
}

import React from 'react'
import { Icon } from '../Icon'
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import { makeStyles } from '@material-ui/core'
import { getDateFormatString } from '../../shared/applications'
import { spacing } from '../../styling'

export const DatePicker: React.FC<{
  handleChange: (date: any) => void
  minDay: any
  selectedDate: Date | null
  fetching: boolean
  label: string
}> = ({ handleChange, minDay, selectedDate, fetching, label }) => {
  const css = useStyles()
  return (
    <>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <KeyboardDatePicker
          autoOk={true}
          className={css.textField}
          disableToolbar
          variant="inline"
          format={getDateFormatString()}
          id="date-picker-inline"
          label={label}
          value={selectedDate || new Date()}
          onChange={handleChange}
          inputVariant="standard"
          disableFuture={true}
          minDate={minDay}
          keyboardIcon={
            <Icon
              name={fetching ? 'spinner-third' : 'calendar-day'}
              type="regular"
              size="md"
              spin={fetching}
              fixedWidth
            />
          }
          InputProps={{
            disabled: true,
          }}
        />
      </MuiPickersUtilsProvider>
    </>
  )
}

const useStyles = makeStyles({
  textField: {
    display: 'block',
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xxs,
    minWidth: 150,
  },
})

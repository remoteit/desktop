import React from 'react'
import { DatePicker } from 'remoteit-desktop-frontend'

const Field: React.FC<{ caption?: string; children?: React.ReactNode }> = ({ caption, children }) => (
  <div style={{ maxWidth: 320, marginBottom: 16 }}>
    {children}
    {caption && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{caption}</div>}
  </div>
)

export const SelectedDate = () => (
  <Field caption="End of the device activity report window">
    <DatePicker selectedDate={new Date(2026, 4, 14)} onChange={() => {}} />
  </Field>
)

export const WithMinimumDay = () => (
  <Field caption="Logs are retained for 30 days on the Business plan">
    <DatePicker
      selectedDate={new Date(2026, 6, 28)}
      minDay={new Date(2026, 6, 1)}
      onChange={() => {}}
    />
  </Field>
)

/* The field label is hardcoded to "Ending" in the component — it is only ever
   the end of a report window, so each cell is a separate saved report. */
export const ReportRange = () => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
    <Field caption="Q4 connection volume report">
      <DatePicker selectedDate={new Date(2025, 11, 31)} onChange={() => {}} />
    </Field>
    <Field caption="July field-fleet uptime report">
      <DatePicker selectedDate={new Date(2026, 6, 31)} onChange={() => {}} />
    </Field>
  </div>
)

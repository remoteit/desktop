import React from 'react'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { SEEN_CHOICES, SeenChoice } from '../../services/fleetVersionsModel'

// Which devices to count by when they were last seen: Online · 7 days · 30 days · All — the days only where the API
// counts by them.
export const SeenToggle: React.FC<{ value: SeenChoice; days: boolean; onChange: (value: SeenChoice) => void }> = ({
  value,
  days,
  onChange,
}) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={value}
    onChange={(_, next) => next && onChange(next)}
    aria-label="Show"
    data-seen-toggle
  >
    {SEEN_CHOICES.filter(choice => days || choice.key === 'online' || choice.key === 'all').map(choice => (
      <ToggleButton key={choice.key} value={choice.key} data-show={choice.key}>
        {choice.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)

// "No devices …": what the choice left in.
export const shownSuffix = (seen: SeenChoice) =>
  seen === 'online' ? ' online' : seen === 'all' ? '' : ` seen in the last ${seen} days`

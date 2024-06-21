import React from 'react'
import feature from './feature.png'
import { SCREEN_VIEW_APP_LINK } from '../../constants'
import { Tooltip, Typography } from '@mui/material'
import { platforms } from '..'
import { Icon } from '../../components/Icon'

const Component = ({ darkMode, ...props }) => {
  const android = '#3DDB85'
  return (
    <svg viewBox="-47 0 375 149" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g transform="translate(-50.000000, -102.000000)">
        <path
          d="M241.91034,212.77477 C235.88519,212.77477 230.98407,207.87018 230.98407,201.84495 C230.98407,195.81972 235.88519,190.91867 241.91034,190.91867 C247.9357,190.91867 252.83661,195.81972 252.83661,201.84495 C252.83661,207.87018 247.9357,212.77477 241.91034,212.77477 M121.13611,212.77477 C115.11073,212.77477 110.20984,207.87018 110.20984,201.84495 C110.20984,195.81972 115.11073,190.91867 121.13611,190.91867 C127.16126,190.91867 132.06236,195.81972 132.06236,201.84495 C132.06236,207.87018 127.16125,212.77477 121.13611,212.77477 M245.82919,146.95461 L267.66745,109.13284 C268.9194,106.95892 268.17459,104.18215 266.00421,102.92674 C263.83386,101.67488 261.05353,102.41961 259.79812,104.58997 L237.6867,142.89049 C220.7777,135.17365 201.7871,130.87549 181.5231,130.87549 C161.25932,130.87549 142.26872,135.17365 125.35972,142.89049 L103.24832,104.58997 C101.99289,102.41961 99.21257,101.67488 97.0422,102.92674 C94.87184,104.18215 94.12358,106.95892 95.37899,109.13284 L117.21723,146.95461 C79.71827,167.34964 54.07112,205.31327 50.31914,250.1639 L312.72725,250.1639 C308.97183,205.31326 283.32468,167.34964 245.82919,146.95461"
          fill={android}
        ></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'android',
  name: 'Android',
  component: Component,
  types: { 1213: 'Android Phone' },
  services: [{ application: 48 }],
  listItemTitle: (
    <>
      Android &nbsp;
      <Tooltip title="Remote.It ScreenView Enabled" placement="top" arrow>
        <span>
          <Icon name="android-screenview" size="xxs" platformIcon currentColor />
        </span>
      </Tooltip>
      <Typography variant="caption" component="div">
        with ScreenView
      </Typography>
    </>
  ),
  installation: {
    download: true,
    command: '[CODE]',
    qualifier: 'To register an Android phone or tablet',
    instructions: (
      <>
        <img src={feature} width={450} style={{ borderRadius: 8, marginBottom: 12 }} />
        <br />
        Install the screen view app from the Google Play Store to share your screen or any other local or network
        services
      </>
    ),
    link: SCREEN_VIEW_APP_LINK,
  },
})

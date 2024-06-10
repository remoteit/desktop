import React from 'react'
import { useHistory } from 'react-router-dom'
import { useMediaQuery, Typography, ButtonBase, Stack, Divider, Theme } from '@mui/material'
import { ListItemLocation } from '../components/ListItemLocation'
import { Link } from 'react-router-dom'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

type OptionProps = {
  to: string
  icon: React.ReactNode
  title: string
  description?: React.ReactNode
}

export const RaspberryPiOption: React.FC<OptionProps> = ({ to, icon, title, description }) => {
  const history = useHistory()

  return (
    <ButtonBase
      onClick={() => history.push(to)}
      sx={{
        padding: 3,
        width: 250,
        minWidth: 250,
        flexDirection: 'column',
        '&:hover': { bgcolor: 'primaryBackground.main' },
      }}
    >
      {icon}
      <Typography variant="body1" marginTop={2} marginBottom={1} width="100%">
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" lineHeight="1.5em">
          {description}
        </Typography>
      )}
    </ButtonBase>
  )
}

export const RaspberrypiOptionsPage: React.FC = () => {
  const xs = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  return (
    <Body center>
      <Typography variant="h2" align="center" color="greyDark.main" marginBottom={3}>
        Set Up Your Raspberry Pi for Remote Access
      </Typography>
      <Stack
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent={{ xs: 'center', md: 'left' }}
        alignItems={{ xs: 'left', md: 'center' }}
        paddingX={{ xs: 3, md: 0 }}
        paddingBottom={4}
        flexWrap="wrap"
      >
        <RaspberryPiOption
          icon={<Icon name="raspberrypi" fontSize={70} platformIcon />}
          to="/add/raspberrypi"
          title="Add Remote Access"
          description={
            <>
              <b>Already have a Raspberry Pi set up?</b> <br />
              Get remote access with a <br />
              single line of code.
            </>
          }
        />
        <RaspberryPiOption
          icon={
            <Stack flexDirection="row" alignItems="center" height={70} gap={1}>
              <Icon name="raspberrypi" fontSize={50} platformIcon styles={{ marginRight: 2 }} />
              <Icon name="plus" fontSize={20} type="solid" styles={{}} />
              <Icon name="bluetooth" fontSize={50} type="brands" color="primary" />
            </Stack>
          }
          to="/onboard/raspberrypi"
          title="Onboard via Bluetooth"
          description={
            <>
              <b>Have our custom Pi image?</b> Set up WiFi via Bluetooth and register your device for remote access.
            </>
          }
        />
        <RaspberryPiOption
          icon={
            <Stack flexDirection="row" alignItems="center" height={70} gap={1.5}>
              <Icon name="raspberrypi" fontSize={50} platformIcon />
              <Icon name="plus" fontSize={20} type="solid" styles={{}} />
              <Icon name="sd-card" fontSize={50} type="solid" color="grayDark" />
            </Stack>
          }
          to="/add/raspberrypi"
          title="Download Pi Image"
          description={
            <>
              <b>New to Pi?</b> Download our disk <br />
              image for easy, headless setup with Bluetooth WiFi onboarding.
            </>
          }
        />
      </Stack>
    </Body>
  )
}

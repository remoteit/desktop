import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { RaspberryPiColor } from '../assets/RaspberryPiColor'
import { AdvantechColor } from '../assets/AdvantechColor'
import { WindowsColor } from '../assets/WindowsColor'
import { OpenWRTColor } from '../assets/OpenWRTColor'
import { UbuntuColor } from '../assets/UbuntuColor'
import { NvidiaColor } from '../assets/NvidiaColor'
import { LinuxColor } from '../assets/LinuxColor'
import { AxisColor } from '../assets/AxisColor'
import { AWSColor } from '../assets/AWSColor'
import { HddColor } from '../assets/HddColor'

export const ColorIcon = ({ name, ...props }) => {
  const darkMode = useSelector((state: ApplicationState) => state.ui.themeDark)

  if (name === 'raspberry-pi') return <RaspberryPiColor {...props} />
  if (name === 'advantech') return <AdvantechColor {...props} />
  if (name === 'windows') return <WindowsColor {...props} />
  if (name === 'openwrt') return <OpenWRTColor darkMode={darkMode} {...props} />
  if (name === 'ubuntu') return <UbuntuColor {...props} />
  if (name === 'nvidia') return <NvidiaColor {...props} />
  if (name === 'linux') return <LinuxColor {...props} />
  if (name === 'axis') return <AxisColor {...props} />
  if (name === 'aws') return <AWSColor darkMode={darkMode} {...props} />
  if (name === 'hdd') return <HddColor darkMode={darkMode} {...props} />

  return null
}

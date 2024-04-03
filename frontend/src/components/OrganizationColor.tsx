import Color from 'color'
import React, { useState } from 'react'
import { REGEX_TAG_SAFE } from '../constants'
import { DEFAULT_RESELLER } from '../models/organization'
import { ColorSelect } from '../components/ColorSelect'
import { Dispatch, State } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Stack, List } from '@mui/material'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { AccordionMenuItem } from './AccordionMenuItem'
import { useLabel } from '../hooks/useLabel'
import { radius } from '../styling'

export const OrganizationTheme: React.FC<{ color?: string }> = ({ color }) => {
  const [open, setOpen] = useState<boolean>(!!color)
  // const organization = useSelector(selectOrganization)
  const dispatch = useDispatch<Dispatch>()
  const getColor = useLabel()
  const labels = useSelector((state: State) => state.labels)
  const label = labels.find(l => l.color === color) || labels[0]
  const tag: ITag = { name: label.name, color: label.id, created: new Date() }

  const onReset = () => {
    dispatch.organization.setReseller({ color: undefined })
    dispatch.ui.set({ themeModified: Math.random() })
    setOpen(false)
  }

  const onSave = (key: string, value: number | string) => {
    dispatch.organization.setReseller({ [key]: value })
    dispatch.ui.set({ themeModified: Math.random() })
  }

  const cx = Color(color)
  const sx = { width: '16%', flexGrow: 1, height: 50 }

  return (
    <AccordionMenuItem subtitle="Theme" onClick={() => setOpen(!open)} onClear={onReset} expanded={open} gutters>
      <List>
        <Stack
          marginX={5}
          marginBottom={3}
          maxWidth={600}
          paddingX={2}
          alignItems="center"
          flexDirection="row"
          bgcolor="grayLighter.main"
          borderRadius={radius.lg + 'px'}
        >
          {/* <img src={reseller.logoUrl} alt="No logo uploaded" style={{ width: '200px', maxHeight: '100px' }} /> */}
          <Stack
            height={100}
            flexGrow={1}
            flexDirection="row"
            flexWrap="wrap"
            marginY={2}
            marginLeft={2}
            borderRadius={radius.sm + 'px'}
            justifyContent="stretch"
            alignItems="stretch"
            overflow="hidden"
          >
            <Box sx={{ bgcolor: 'primary.main', ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(17).saturate(1.5).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(78).desaturate(0.3).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(93).desaturate(0.2).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(96).desaturate(0.5).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(95).desaturate(0.6).hex(), ...sx }} />
            {/* <Box sx={{ bgcolor: '#0096e7', ...sx }} />
          <Box sx={{ bgcolor: '#034b9d', ...sx }} />
          <Box sx={{ bgcolor: '#9ed3f0', ...sx }} />
          <Box sx={{ bgcolor: '#e3f4ff', ...sx }} />
          <Box sx={{ bgcolor: '#edf8ff', ...sx }} />
          <Box sx={{ bgcolor: '#EAF4FA', ...sx }} /> */}
            {/* dark */}
            <Box sx={{ bgcolor: 'primary.main', ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(17).saturate(1.5).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(37).desaturate(0.2).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(24).desaturate(0.5).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(18).desaturate(0.77).hex(), ...sx }} />
            <Box sx={{ bgcolor: cx.lightness(16).desaturate(0.88).hex(), ...sx }} />
            {/* <Box sx={{ bgcolor: '#0096e7', ...sx }} />
          <Box sx={{ bgcolor: '#034b9d', ...sx }} />
          <Box sx={{ bgcolor: '#1C72AD', ...sx }} />
          <Box sx={{ bgcolor: '#21435B', ...sx }} />
          <Box sx={{ bgcolor: '#1f3042', ...sx }} />
          <Box sx={{ bgcolor: '#212a35', ...sx }} /> */}
          </Stack>
        </Stack>
        <InlineTextFieldSetting
          value={color}
          color={color}
          icon={<ColorSelect tag={tag} onSelect={color => onSave('color', getColor(color))} />}
          resetValue={undefined}
          filter={REGEX_TAG_SAFE}
          onSave={value => onSave('color', value)}
        />
        {/* <InlineTextFieldSetting
          icon="at"
          value={logoUrl}
          label="Logo URL"
          resetValue={logoUrl}
          onSave={value => onSave('logoUrl', value)}
        /> */}
        {/* <InlineTextFieldSetting
          icon="circle"
          value={t.largeRadius}
          label="Large Radius"
          resetValue={t.largeRadius}
          onSave={value => onSave('largeRadius', value)}
        />
        <InlineTextFieldSetting
          icon="square"
          value={t.smallRadius}
          label="Small Radius"
          resetValue={t.smallRadius}
          onSave={value => onSave('smallRadius', value)}
        /> */}
      </List>
    </AccordionMenuItem>
  )
}

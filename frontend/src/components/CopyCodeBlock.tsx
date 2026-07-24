import React from 'react'
import { useTranslation } from 'react-i18next'
import { windowOpen } from '../services/browser'
import { Box, Stack, Paper, PaperProps, Typography } from '@mui/material'
import { spacing, fontSizes, toSxArray } from '../styling'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'

export type CopyCodeBlockProps = PaperProps & {
  value?: string
  code?: string
  label?: string
  link?: string
  display?: React.ReactNode
  hideCopyLabel?: boolean
  onCopy?: () => void
}

export const CopyCodeBlock: React.FC<CopyCodeBlockProps> = ({
  value,
  code,
  label,
  display,
  link,
  hideCopyLabel,
  onCopy,
  sx,
  ...props
}) => {
  const { t } = useTranslation()
  if (code === value) code = undefined
  if (!value) return null

  return (
    <Paper
      elevation={0}
      sx={[
        { display: 'flex', backgroundColor: 'grayLightest.main', minWidth: 200 },
        ...toSxArray(sx),
      ]}
      {...props}
    >
      <Stack
        flexGrow={1}
        justifyContent="center"
        flexDirection="column"
        alignItems="flex-start"
        padding={2}
        paddingLeft={3}
      >
        {label && <Typography variant="h5">{label}</Typography>}
        <Typography
          sx={{
            fontSize: fontSizes.sm,
            color: 'grayDarker.main',
            marginTop: '2px',
            marginBottom: '2px',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          variant="h4"
        >
          {display || value}
        </Typography>
      </Stack>
      {(code || value) && (
        <Box
          sx={theme => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${spacing.xs}px`,
            borderLeft: `1px solid ${theme.palette.grayLighter.main}`,
            '& .MuiTypography-root': { marginBottom: `${spacing.xxs}px` },
            '& span': { marginRight: `${spacing.xs}px`, marginLeft: `${spacing.xs}px` },
            '& span + span': { marginTop: `${-spacing.xs}px` },
          })}
        >
          {!hideCopyLabel && (
            <Typography variant="h5" marginTop={1}>
              {t('copyCodeBlock.copy', 'Copy')}
            </Typography>
          )}
          {value && (
            <CopyIconButton
              size="base"
              value={value}
              placement="left"
              variant="text"
              icon={code ? 'command' : 'clone'}
              type="regular"
              title={code ? t('copyCodeBlock.copyCommand', 'Copy command') : t('copyCodeBlock.copy', 'Copy')}
              onCopy={onCopy}
            />
          )}
          {code && (
            <CopyIconButton
              size="base"
              value={code}
              placement="left"
              variant="text"
              type="regular"
              icon={code === value ? 'copy' : 'barcode'}
              title={t('copyCodeBlock.copyCode', 'Copy code')}
              onCopy={onCopy}
            />
          )}
        </Box>
      )}
      {link && (
        <IconButton
          fixedWidth
          size="xl"
          icon="launch"
          color="primary"
          variant="contained"
          onClick={() => windowOpen(link, '_blank', true)}
          sx={{ width: 64, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        />
      )}
    </Paper>
  )
}

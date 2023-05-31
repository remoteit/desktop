import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, Paper, PaperProps, Typography } from '@mui/material'
import { spacing, fontSizes, radius } from '../styling'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { IconButton } from '../buttons/IconButton'
import classnames from 'classnames'

type Props = PaperProps & {
  value?: string
  code?: string
  label?: string
  link?: string
  showBackground?: boolean
}

export const CopyCodeBlock: React.FC<Props> = ({ value, code, label, link, ...props }) => {
  const css = useStyles()

  if (!value) return null

  return (
    <Paper elevation={0} sx={{ backgroundColor: 'grayLightest.main' }} className={css.paper} {...props}>
      <Box display="flex" padding={2} flexGrow={1} alignItems="stretch">
        <Box>
          <CopyIconButton size="md" value={value} placement="left" icon="clone" title="Copy" inlineLeft />
        </Box>
        <Box flexGrow={1} display="flex" justifyContent="center" flexDirection="column">
          {label && <Typography variant="h5">{label}</Typography>}
          <Typography className={css.key} variant="h4">
            {value}
          </Typography>
        </Box>
      </Box>
      {code && value && code !== value && (
        <Box className={classnames('hidden', css.icons)}>
          <Typography variant="h5" marginTop={1}>
            Copy
          </Typography>
          <CopyIconButton
            size="base"
            value={value}
            placement="right"
            variant="text"
            color="grayDark"
            icon={code ? 'command' : 'copy'}
            title="Copy command"
          />
          <CopyIconButton
            size="base"
            value={code}
            placement="right"
            variant="text"
            color="grayDark"
            icon={code === value ? 'copy' : 'barcode'}
            title="Copy code"
          />
        </Box>
      )}
      {link && (
        <IconButton
          fixedWidth
          size="xl"
          icon="launch"
          color="primary"
          variant="contained"
          onClick={() => (window.location.href = link)}
          className={css.button}
        />
      )}
    </Paper>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  icons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
    '& .MuiTypography-root': { marginBottom: spacing.xxs },
    '& span': { marginRight: spacing.xs, marginLeft: spacing.xs },
    '& span + span': { marginTop: -spacing.xxs },
  },
  paper: {
    marginTop: 2,
    marginBottom: 1,
    display: 'flex',
    '& .hidden': { opacity: 0, transition: 'opacity 400ms' },
    '&:hover .hidden': { opacity: 1 },
  },
  button: {
    minHeight: 80,
    width: 80,
    marginRight: -spacing.xxl,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  key: {
    fontSize: fontSizes.sm,
    color: palette.grayDarker.main,
    marginTop: 2,
    marginBottom: 2,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}))

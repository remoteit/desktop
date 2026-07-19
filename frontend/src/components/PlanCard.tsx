import React from 'react'
import { MOBILE_WIDTH } from '../constants'
import { useMediaQuery, Typography, List, ListItem, ListItemIcon, Divider, Button, Box } from '@mui/material'
import { spacing, fontSizes, radius } from '../styling'
import { Icon } from './Icon'

type Props = {
  name: string | React.ReactNode
  description: string
  price?: string
  caption: React.ReactNode
  note?: string
  features?: string[]
  button: string
  promoted?: boolean
  disabled?: boolean
  selected?: boolean
  loading?: boolean
  wide?: boolean
  onSelect?: () => void
}


export const PlanCard: React.FC<Props> = ({
  name,
  description,
  price,
  caption,
  note,
  features = [],
  button,
  promoted,
  disabled,
  selected,
  loading,
  wide,
  onSelect,
}) => {
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  wide = wide && !mobile

  return (
    <Box
      className="planCard"
      sx={[
        theme => ({
          display: 'flex',
          width: '100%',
          maxWidth: 840,
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderRadius: `${radius.lg}px`,
          backgroundColor: selected ? theme.palette.primaryHighlight.main : theme.palette.grayLightest.main,
          paddingBottom: `${spacing.md}px`,
          marginBottom: `${spacing.md}px`,
          [theme.breakpoints.up('sm')]: {
            '& + .planCard': { marginLeft: `${spacing.md}px` },
          },
          '& .planCardColumn': {
            display: wide ? 'flex' : 'block',
            '& > div + div': { marginLeft: wide ? `${spacing.md}px` : undefined },
          },
        }),
        selected
          ? theme => ({
              borderRadius: `${radius.lg}px`,
              position: 'relative',
              overflow: 'hidden',
              '& .MuiDivider-root': { borderColor: theme.palette.primaryLight.main },
              '& header': {
                width: '100%',
                position: 'absolute',
                textTransform: 'uppercase',
                textAlign: 'center',
                backgroundColor: theme.palette.primaryLight.main,
                letterSpacing: spacing.xxs,
                fontSize: fontSizes.xxxs,
                color: theme.palette.alwaysWhite.main,
                fontWeight: 700,
                lineHeight: 2,
              },
            })
          : {},
        !selected && promoted
          ? theme => ({
              position: 'relative',
              overflow: 'hidden',
              '& header': {
                width: 160,
                left: -40,
                top: 24,
                position: 'absolute',
                textTransform: 'uppercase',
                transform: 'rotate(-45deg)',
                backgroundColor: theme.palette.danger.main,
                letterSpacing: spacing.xxs,
                fontSize: fontSizes.xs,
                color: theme.palette.alwaysWhite.main,
                fontWeight: 700,
                lineHeight: 2.6,
              },
            })
          : {},
      ]}
    >
      {selected ? <header>Current plan</header> : promoted && <header>New</header>}
      <Box sx={{ padding: `${spacing.md}px`, paddingTop: `${spacing.xl}px`, textAlign: 'center', '& h1': { textTransform: 'capitalize' } }}>
        <Typography variant="h1">{name}</Typography>
        <Typography variant="caption">{description}</Typography>
      </Box>
      <Divider flexItem variant="inset" />
      <div className="planCardColumn">
        <div>
          <Box
            sx={{
              padding: `${spacing.md}px`,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 100,
              '& .MuiButton-root': { marginTop: `${spacing.sm}px` },
            }}
          >
            {price !== undefined && <Typography variant="h1">{price}</Typography>}
            <Typography variant="body2" component="div">
              {caption}
            </Typography>
            {note !== undefined && <Typography variant="caption">{note}</Typography>}
          </Box>
          <Button
            onClick={onSelect}
            size="small"
            variant="contained"
            disabled={disabled}
            color={loading ? 'inherit' : 'primary'}
            sx={{ marginBottom: `${spacing.sm}px` }}
          >
            {loading ? 'Processing...' : button}
          </Button>
        </div>
        {!!features.length && (
          <Box
            sx={theme => ({
              paddingRight: `${spacing.sm}px`,
              color: theme.palette.grayDarker.main,
              fontSize: fontSizes.sm,
              maxWidth: wide ? 440 : 200,
              lineHeight: 1.3,
              '& b': { fontWeight: 400, color: theme.palette.grayDarkest.main },
              '& .MuiListItemIcon-root': { minWidth: 40 },
            })}
          >
            <List dense>
              {features[0] && (
                <Item>
                  <b>{features[0]}</b>
                </Item>
              )}
              {features.map((f, index) => index > 0 && <Item key={index}>{f}</Item>)}
            </List>
          </Box>
        )}
      </div>
    </Box>
  )
}

export const Item: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <ListItem disableGutters dense>
      <ListItemIcon>
        <Icon name="check" color="primary" />
      </ListItemIcon>
      {children}
    </ListItem>
  )
}


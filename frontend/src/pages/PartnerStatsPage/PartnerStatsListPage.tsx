import React, { useEffect, useState, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Typography, Box, TextField, InputAdornment } from '@mui/material'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Gutters } from '../../components/Gutters'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Attribute } from '../../components/Attributes'
import { State, Dispatch } from '../../store'
import { makeStyles } from '@mui/styles'
import { removeObject } from '../../helpers/utilHelper'
import { useSelector, useDispatch } from 'react-redux'
import { getPartnerStatsModel } from '../../models/partnerStats'
import { selectDefaultSelectedPage } from '../../selectors/ui'

class PartnerStatsAttribute extends Attribute {
  type: Attribute['type'] = 'MASTER'
}

const partnerStatsAttributes: Attribute[] = [
  new PartnerStatsAttribute({
    id: 'partnerName',
    label: 'Name',
    defaultWidth: 250,
    required: true,
    value: ({ partner }: { partner: any }) => partner?.name || partner?.id,
  }),
  new PartnerStatsAttribute({
    id: 'partnerDevicesTotal',
    label: 'Devices',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.deviceCount || 0,
  }),
  new PartnerStatsAttribute({
    id: 'partnerActivated',
    label: 'Activated',
    defaultWidth: 100,
    value: ({ partner }: { partner: any }) => partner?.activated || 0,
  }),
  new PartnerStatsAttribute({
    id: 'partnerActive',
    label: 'Active',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.active || 0,
  }),
  new PartnerStatsAttribute({
    id: 'partnerOnline',
    label: 'Online',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.online || 0,
  }),
]

export const PartnerStatsListPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()
  const [searchValue, setSearchValue] = useState('')
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const userId = useSelector((state: State) => state.user.id)
  const partnerStatsModel = useSelector((state: State) => getPartnerStatsModel(state))
  const { flattened: partners, fetching: loading, initialized } = partnerStatsModel
  const [required, attributes] = removeObject(partnerStatsAttributes, a => a.required === true)
  const defaultSelected = useSelector(selectDefaultSelectedPage)

  useEffect(() => {
    dispatch.partnerStats.fetchIfEmpty()
    // Restore previous selection for this account, or clear to root if none
    const savedPath = defaultSelected['/partner-stats']
    if (savedPath && location.pathname !== savedPath) {
      history.push(savedPath)
    } else if (!savedPath && location.pathname !== '/partner-stats') {
      history.push('/partner-stats')
    }
  }, [userId])

  const filteredPartners = useMemo(() => {
    if (!searchValue.trim()) return partners
    const search = searchValue.toLowerCase()
    return partners.filter(partner => 
      partner.name?.toLowerCase().includes(search) ||
      partner.id?.toLowerCase().includes(search)
    )
  }, [partners, searchValue])

  const handlePartnerClick = (partnerId: string) => {
    const to = `/partner-stats/${partnerId}`
    dispatch.ui.setDefaultSelected({ key: '/partner-stats', value: to })
    history.push(to)
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters>
          <TextField
            fullWidth
            size="small"
            placeholder="Search partners..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" size="md" color="grayDark" />
                </InputAdornment>
              ),
            }}
          />
        </Gutters>
      }
    >
      {loading && !initialized ? (
        <LoadingMessage message="Loading partners..." />
      ) : filteredPartners.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="handshake" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {searchValue ? 'No matching partners' : 'No partners found'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You don't have admin access to any partner entities.
          </Typography>
        </Box>
      ) : (
        <GridList attributes={attributes} required={required} columnWidths={columnWidths} fetching={loading} headerIcon>
          {filteredPartners.map(partner => (
            <GridListItem
              key={partner.id}
              onClick={() => handlePartnerClick(partner.id)}
              selected={location.pathname.includes(`/partner-stats/${partner.id}`)}
              disableGutters
              icon={<Icon name="building" size="md" color="grayDark" />}
              required={required?.value({ partner })}
            >
              {attributes.map(attribute => (
                <Box key={attribute.id} className="attribute">
                  <div className={css.truncate}>{attribute.value({ partner })}</div>
                </Box>
              ))}
            </GridListItem>
          ))}
        </GridList>
      )}
    </Container>
  )
}

const useStyles = makeStyles(() => ({
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
  },
}))

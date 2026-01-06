import React, { useEffect, useState, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Box, TextField, InputAdornment, Stack } from '@mui/material'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { graphQLAdminPartners } from '../../services/graphQLRequest'
import { Gutters } from '../../components/Gutters'
import { GridList } from '../../components/GridList'
import { GridListItem } from '../../components/GridListItem'
import { Attribute } from '../../components/Attributes'
import { State } from '../../store'
import { makeStyles } from '@mui/styles'
import { removeObject } from '../../helpers/utilHelper'

class AdminPartnerAttribute extends Attribute {
  type: Attribute['type'] = 'MASTER'
}

const adminPartnerAttributes: Attribute[] = [
  new AdminPartnerAttribute({
    id: 'partnerName',
    label: 'Name',
    defaultWidth: 250,
    required: true,
    value: ({ partner }: { partner: any }) => partner?.name || partner?.id,
  }),
  new AdminPartnerAttribute({
    id: 'partnerDevicesTotal',
    label: 'Devices',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.deviceCount || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerActivated',
    label: 'Activated',
    defaultWidth: 100,
    value: ({ partner }: { partner: any }) => partner?.activated || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerActive',
    label: 'Active',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.active || 0,
  }),
  new AdminPartnerAttribute({
    id: 'partnerOnline',
    label: 'Online',
    defaultWidth: 80,
    value: ({ partner }: { partner: any }) => partner?.online || 0,
  }),
]

export const AdminPartnersListPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const css = useStyles()
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(adminPartnerAttributes, a => a.required === true)

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    const result = await graphQLAdminPartners()
    if (result !== 'ERROR' && result?.data?.data?.admin?.partners) {
      setPartners(result.data.data.admin.partners || [])
    }
    setLoading(false)
  }

  const filteredPartners = useMemo(() => {
    if (!searchValue.trim()) return partners
    const search = searchValue.toLowerCase()
    return partners.filter(partner => 
      partner.name?.toLowerCase().includes(search) ||
      partner.id?.toLowerCase().includes(search)
    )
  }, [partners, searchValue])

  const handlePartnerClick = (partnerId: string) => {
    history.push(`/admin/partners/${partnerId}`)
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <Gutters>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              icon="sync"
              title="Refresh"
              onClick={fetchPartners}
              spin={loading}
              size="md"
            />
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
          </Stack>
        </Gutters>
      }
    >
      {loading ? (
        <LoadingMessage message="Loading partners..." />
      ) : filteredPartners.length === 0 ? (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Icon name="handshake" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {searchValue ? 'No matching partners' : 'No partners found'}
          </Typography>
        </Box>
      ) : (
        <GridList
          attributes={attributes}
          required={required}
          columnWidths={columnWidths}
          fetching={loading}
        >
          {filteredPartners.map(partner => (
            <GridListItem
              key={partner.id}
              onClick={() => handlePartnerClick(partner.id)}
              selected={location.pathname.includes(`/admin/partners/${partner.id}`)}
              disableGutters
              icon={<Icon name="building" size="md" color="grayDark" />}
              required={required?.value({ partner })}
            >
              {attributes.map(attribute => (
                <Box key={attribute.id} className="attribute">
                  <div className={css.truncate}>
                    {attribute.value({ partner })}
                  </div>
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


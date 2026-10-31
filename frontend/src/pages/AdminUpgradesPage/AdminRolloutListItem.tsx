import React from 'react'
import { Box } from '@mui/material'
import { GridListItem } from '../../components/GridListItem'
import { Icon } from '../../components/Icon'
import type { RolloutRun } from '../../services/graphQLDaemonRollout'
import { AdminRolloutAttribute } from './adminRolloutAttributes'
import { active as isActive } from './rolloutHelpers'

interface Props {
  run: RolloutRun
  required?: AdminRolloutAttribute
  attributes: AdminRolloutAttribute[]
  active?: boolean
  onClick: () => void
}

export const AdminRolloutListItem: React.FC<Props> = ({ run, required, attributes, active, onClick }) => {
  const live = isActive(run)
  return (
    <GridListItem
      onClick={onClick}
      selected={active}
      disableGutters
      data-rollout={run.id}
      sx={live ? { backgroundColor: 'primaryHighlight.main' } : undefined}
      icon={
        <Icon
          name={run.state === 'holding' ? 'pause' : live ? 'rocket-launch' : run.state === 'aborted' ? 'ban' : 'box'}
          size="md"
          color={run.state === 'holding' ? 'warning' : live ? 'primary' : 'grayDark'}
        />
      }
      required={required?.value({ run })}
    >
      {attributes.map(attribute => (
        <Box key={attribute.id} className="attribute">
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
            {attribute.value({ run })}
          </Box>
        </Box>
      ))}
    </GridListItem>
  )
}

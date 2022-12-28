import React from 'react'
import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { getActiveAccountId } from '../selectors/accounts'
import { canEditTags } from '../models/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

const TEMP_DATE = new Date()
type Props = { button?: string; types: number[]; onChange: (tags: number[]) => void }

export const AddPlatformServices: React.FC<Props> = ({ button, types, onChange }) => {
  const { allTypes, canEdit } = useSelector((state: ApplicationState) => ({
    accountId: getActiveAccountId(state),
    allTypes: state.applicationTypes.all,
    canEdit: canEditTags(state),
  }))
  // const dispatch = useDispatch<Dispatch>()
  const selectedApplicationTypes = allTypes.filter(t => types.includes(t.id))
  const selectedTags = selectedApplicationTypes.map(t => ({ name: t.name, created: TEMP_DATE, color: t.id }))
  const allTags = allTypes.map(t => ({ name: t.name, created: TEMP_DATE, color: t.id }))

  return (
    <Box display="flex" flexWrap="wrap" justifyContent="flex-end" marginTop={2}>
      <Tags
        hideLabels
        textAlign="right"
        showEmpty={!canEdit}
        tags={selectedTags}
        onDelete={canEdit ? tag => onChange(types.filter(t => t !== tag.color)) : undefined}
      />
      {canEdit && (
        <TagEditor
          hideIcons
          label="SERVICE"
          allowAdding={false}
          placeholder="Add a service type..."
          onSelect={tag => onChange([...types, tag.color])}
          tags={allTags}
          filter={selectedTags}
          button={button}
        />
      )}
    </Box>
  )
}

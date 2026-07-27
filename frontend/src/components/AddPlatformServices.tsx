import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { Stack, StackProps } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { canEditTags } from '../models/tags'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

const TEMP_DATE = new Date()
type Props = StackProps & { button?: string; types: number[]; onChange: (tags: number[]) => void }

export const AddPlatformServices: React.FC<Props> = ({ button, types, onChange, ...props }) => {
  const { t } = useTranslation()
  const { allTypes, canEdit } = useSelector((state: State) => ({
    accountId: selectActiveAccountId(state),
    allTypes: state.applicationTypes.all,
    canEdit: canEditTags(state),
  }))
  const selectedApplicationTypes = allTypes.filter(t => types.includes(t.id))
  const selectedTags = selectedApplicationTypes.map(t => ({ name: t.name, created: TEMP_DATE, color: t.id }))
  const allTags = allTypes.map(t => ({ name: t.name, created: TEMP_DATE, color: t.id }))

  return (
    <Stack flexWrap="wrap" marginTop={2} alignItems="flex-end" {...props}>
      <Tags
        hideLabels
        showEmpty={!canEdit}
        tags={selectedTags}
        onDelete={canEdit ? tag => onChange(types.filter(t => t !== tag.color)) : undefined}
      />
      {canEdit && (
        <TagEditor
          hideIcons
          label={t('addPlatformServices.label', 'SERVICE')}
          allowAdding={false}
          placeholder={t('addPlatformServices.placeholder', 'Add a service type...')}
          onSelect={tag => onChange([...types, tag.color])}
          tags={allTags}
          filter={selectedTags}
          button={button}
        />
      )}
    </Stack>
  )
}

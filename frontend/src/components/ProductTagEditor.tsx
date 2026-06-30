import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, State } from '../store'
import { selectActiveAccountId } from '../selectors/accounts'
import { canEditTags } from '../models/tags'
import { selectTags } from '../selectors/tags'
import { IDeviceProduct } from '../models/products'
import { TagEditor } from './TagEditor'
import { Tags } from './Tags'

type Props = { product?: IDeviceProduct; button?: string }

export const ProductTagEditor: React.FC<Props> = ({ product, button }) => {
  const accountId = useSelector((state: State) => selectActiveAccountId(state))
  const allTags = useSelector((state: State) => selectTags(state, accountId))
  const canEdit = useSelector((state: State) => canEditTags(state, accountId))
  const dispatch = useDispatch<Dispatch>()

  if (!product) return null

  const productTagNames = product.tags || []
  const productTags = allTags.filter(t => productTagNames.includes(t.name))

  const updateTags = (tags: string[]) => {
    dispatch.products.updateProduct({ id: product.id, input: { tags } })
  }

  return (
    <>
      <Tags
        showEmpty={!canEdit}
        tags={productTags}
        onDelete={canEdit ? tag => updateTags(productTagNames.filter(t => t !== tag.name)) : undefined}
      />
      {canEdit && (
        <TagEditor
          onCreate={async tag => await dispatch.tags.create({ tag, accountId })}
          onSelect={tag => {
            if (!productTagNames.includes(tag.name)) {
              updateTags([...productTagNames, tag.name])
            }
          }}
          tags={allTags}
          filter={productTags}
          button={button}
        />
      )}
    </>
  )
}

import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileUpload } from './FileUpload'

export const OrganizationSAMLUpload: React.FC<{ onUpload: (data: any) => void }> = ({ onUpload }) => {
  const { t } = useTranslation()
  return (
    <FileUpload
      mode="text"
      label={t('organizationSamlUpload.label', 'Select SAML metadata file')}
      subLabel={t('organizationSamlUpload.subLabel', 'Drag and drop or click')}
      onChange={text => onUpload(text)}
    />
  )
}

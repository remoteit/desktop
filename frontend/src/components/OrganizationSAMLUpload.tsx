import React from 'react'
import { FileUpload } from './FileUpload'

export const OrganizationSAMLUpload: React.FC<{ onUpload: (data: any) => void }> = ({ onUpload }) => {
  return (
    <FileUpload
      mode="text"
      label="Select SAML metadata file"
      subLabel="Drag and drop or click"
      onChange={text => onUpload(text)}
    />
  )
}

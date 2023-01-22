import React, { useState } from 'react'
import { REGEX_URL_PATHNAME } from '../shared/constants'
import { getApplicationType } from '../shared/applications'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'

type ReturnProps = [urlField: string, setUrlField: (value?: string | IService) => void, error?: string]

export function useURLForm(
  form: IService | undefined,
  setForm: React.Dispatch<React.SetStateAction<IService | undefined>>,
  enabled: boolean
): ReturnProps {
  const applicationTypes = useSelector((state: ApplicationState) => state.applicationTypes.all)
  const [urlError, setUrlError] = useState<string>()
  const [field, setField] = useState<string>('')

  function safeURL(form?: IService): string {
    if (!form) return ''
    const applicationType = applicationTypes.find(a => a.id === form.typeID)
    let string = `${applicationType?.scheme || 'http'}://${form.host}:${form.port}`
    string = safeParse(string)?.origin || string
    if (form.attributes) string += `${safePathname(form.attributes.launchTemplate)}`
    return string
  }

  function safeParse(field: string) {
    let result
    try {
      result = new URL(field)
      if (urlError) setUrlError(undefined)
    } catch (e) {
      result = field
      if (!urlError && setUrlError) setUrlError('Please enter a valid url.')
    }
    return result
  }

  function safePathname(url?: string) {
    if (!url) return ''
    const match = url.match(REGEX_URL_PATHNAME)
    return match ? `/${match[3]}` : ''
  }

  const formToField = (form?: IService) => {
    if (!form) return
    setField(safeURL(form))
  }

  const fieldToForm = (value: string) => {
    if (!form || !enabled) return

    value = 'http' + value.slice(4)
    setField(value)

    const parsed = safeParse(value)
    const scheme = parsed.protocol?.slice(0, -1)
    const applicationType = applicationTypes?.find(a => a.scheme === scheme)
    const port = parsed.port ? parseInt(parsed.port, 10) : applicationType?.port
    const app = getApplicationType(applicationType?.id)
    const template = form?.attributes.launchTemplate || app.launchTemplate
    const match = template.match(REGEX_URL_PATHNAME)
    const baseTemplate = match ? match[1] + match[2].substring(0, match[2].length - 1) : template
    const launchTemplate = baseTemplate + safePathname(value)

    setForm({
      ...form,
      port,
      typeID: applicationType?.id || form.typeID,
      host: parsed.hostname || form.host,
      attributes: {
        ...form.attributes,
        launchTemplate,
      },
    })
  }

  const smartSetField = (value?: string | IService) => {
    if (typeof value === 'string') fieldToForm(value)
    else formToField(value)
  }

  return [field, smartSetField, urlError]
}

import React, { useState } from 'react'
import { IP_PRIVATE, REGEX_URL_PATHNAME } from '../shared/constants'
import { getApplicationType } from '../shared/applications'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'

type ReturnProps = [urlField?: string, setUrlField?: (value: string) => void, error?: string]

const DEFAULT_FIELD = `http://${IP_PRIVATE}`
const DEFAULT_URL = new URL(DEFAULT_FIELD)

export function useURLForm(
  form: IService | undefined,
  setForm: React.Dispatch<React.SetStateAction<IService | undefined>>,
  enabled: boolean
): ReturnProps {
  const applicationTypes = useSelector((state: ApplicationState) => state.applicationTypes.all)
  const [urlError, setUrlError] = useState<string>()

  function formToField(form?: IService) {
    if (!form) return DEFAULT_FIELD
    let string = `${form.type.toLowerCase()}://${form.host}:${form.port}`
    if (form.attributes) string += `${safePathname(form.attributes)}`
    return safeParse(string).href
  }

  function safeParse(field?: string) {
    let result
    try {
      result = new URL(field || DEFAULT_FIELD)
      if (urlError) setUrlError(undefined)
    } catch (e) {
      console.warn('safe parse error', e)
      result = DEFAULT_URL
      if (!urlError && setUrlError) setUrlError('Please enter a valid url.')
    }
    return result
  }

  function safePathname(attributes: IService['attributes']) {
    if (!attributes.launchTemplate) return ''
    const index = attributes.launchTemplate.match(REGEX_URL_PATHNAME)?.index
    return index ? attributes.launchTemplate.substring(index) : ''
  }

  const fieldToForm = (value: string) => {
    if (!form || !enabled) return

    const parsed = safeParse('http' + value.slice(4))
    const scheme = parsed.protocol?.slice(0, -1)
    const applicationType = applicationTypes?.find(a => a.scheme === scheme)
    const port = parsed.port ? parseInt(parsed.port, 10) : applicationType?.port
    const app = getApplicationType(applicationType?.id)
    const template = form?.attributes.launchTemplate || app.launchTemplate
    const index = template.match(REGEX_URL_PATHNAME)?.index
    const baseTemplate = template.substring(0, index)
    const launchTemplate = baseTemplate + parsed.pathname

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

  return [formToField(form), fieldToForm, urlError]
}

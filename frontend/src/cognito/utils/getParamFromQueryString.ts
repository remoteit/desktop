import qs from 'query-string'

export default function getParamFromURL(search: string, param: string): string {
  const parsedSearch = qs.parse(search) as any
  if (parsedSearch[param] && typeof parsedSearch[param] === 'string') {
    return parsedSearch[param]
  } else {
    let value = ''
    if (parsedSearch[param] && parsedSearch[param][0]) {
      value = parsedSearch[param] && parsedSearch[param][0]
    }
    return value
  }
}

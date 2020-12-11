export const getDateFormatString = () => {
  const formatObj = new Intl.DateTimeFormat(window.navigator.language).formatToParts(new Date())
  return formatObj
    .map(obj => {
      switch (obj.type) {
        case 'day':
          return 'dd'
        case 'month':
          return 'MM'
        case 'year':
          return 'yyyy'
        default:
          return obj.value
      }
    })
    .join('')
}
export const getTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

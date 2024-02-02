import { createTransform } from 'redux-persist'

// Utility function to determine if a string is an ISO date string
const isIsoDateString = value => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
  return typeof value === 'string' && isoDateRegex.test(value)
}

// Transform function
const DateTransform = createTransform(
  // Transform state going to storage (no changes needed)
  (inboundState, key) => inboundState,

  // Transform state coming out of storage
  (outboundState, key) => {
    // Recursively convert date strings to Date objects
    const convertDates = obj => {
      if (obj !== null && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const value = obj[key]
          if (isIsoDateString(value)) {
            obj[key] = new Date(value)
          } else if (typeof value === 'object') {
            convertDates(value)
          }
        })
      }
      return obj
    }
    return convertDates(outboundState)
  }
)

export default DateTransform

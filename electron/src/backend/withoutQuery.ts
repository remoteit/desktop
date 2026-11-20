// An auth callback carries the OAuth code and state in its query, so logs keep only the part before it.
export const withoutQuery = (url = '') => url.split('?')[0]

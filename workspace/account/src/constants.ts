

//API
export const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || '26g0ltne0gr8lk1vs51mihrmig'
export const API_URL = process.env.REACT_APP_API_URL || process.env.API_URL || 'https://api.remote.it/apv/v27'
export const GRAPHQL_API = process.env.REACT_APP_GRAPHQL_API || 'https://api.remote.it/graphql/dev'
export const GRAPHQL_BETA_API = process.env.REACT_APP_GRAPHQL_BETA_API || 'https://api.remote.it/graphql/beta'
export const CALLBACK_URL =
  process.env.REACT_APP_CALLBACK_URL || process.env.CALLBACK_URL || process.env.NODE_ENV === 'development'
    ? 'https://dev-auth.internal.remote.it/v1/callback'
    : 'https://auth.api.remote.it/v1/callback'

//General
export const ENVIRONMENT = process.env.NODE_ENV || 'production'

//Locize - translate
export const LOCIZE_PROJECT_ID = process.env.LOCIZE_PROJECT_ID || '801e851c-2d8f-4daf-bed1-c9bba90a5802'
export const LOCIZE_API_KEY = process.env.LOCIZE_API_KEY || 'b2bf338d-2bd9-4bc7-afcf-132f33ebdb36'

export const DEVELOPER_KEY = process.env.DEVELOPER_KEY || 'Q0M3MUMyNkItQkRGQS00OEFBLUE4NTQtNzVGQzU0NDgyRkU5'
export const TASK_QUEUE_NAME = process.env.TASK_QUEUE_NAME || 'WeavedTaskQueue'
export const JOB_QUEUE_NAME = process.env.JOB_QUEUE_NAME || 'WeavedJobQueue'
export const REACT_APP_COGNITO_CLIENT_ID='26g0ltne0gr8lk1vs51mihrmig'

export const REGEX_VALID_URL = /^(ftp|http|https):\/\/[^ "]+$/


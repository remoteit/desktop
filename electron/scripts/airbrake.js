/** The electron-builder config with the backend's Airbrake project packaged into package.json, if `env` has one. */
function withAirbrake(base, env) {
  const projectId = Number(env.AIRBRAKE_PROJECT_ID)
  const projectKey = env.AIRBRAKE_PROJECT_KEY
  if (!projectId || !projectKey) {
    console.warn('AIRBRAKE_PROJECT_ID or AIRBRAKE_PROJECT_KEY not set: this build will not report errors to Airbrake')
    return base
  }
  return { ...base, extraMetadata: { ...base.extraMetadata, airbrake: { projectId, projectKey } } }
}

module.exports = { withAirbrake }

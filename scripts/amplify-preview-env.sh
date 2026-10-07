# Sourced by amplify.yml for PR previews. Amplify gives a preview the app-level environment, not its
# base branch's, and the app level pins the legacy production API, so a preview would otherwise sign
# in as remoteit_desktop on login.remote.it. Pinning the dev issuer selects STAGES.dev for the rest.
unset VITE_GRAPHQL_API VITE_WEBSOCKET_URL
export VITE_OAUTH_ISSUER=https://login.dev.remote.it
export VITE_OAUTH_CLIENT_ID=remoteit_portal
# A pinned build otherwise calls the agent at /agent, which only the vite dev server proxies.
export VITE_AGENT_URL=https://agent.dev.remote.it

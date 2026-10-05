import React, { useCallback, useEffect, useState } from 'react'
import { List, ListItem, ListItemIcon, ListItemText, ListSubheader } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { graphQLPublicProxies, graphQLRemoveRemoteitProxy, graphQLSetProxyPublicExit } from '../services/graphQLProxy'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { Icon } from '../components/Icon'

type PublicProxy = Exclude<Awaited<ReturnType<typeof graphQLPublicProxies>>, 'ERROR' | typeof UNSUPPORTED>[number]

/* remote.it's proxies (presence-server docs/proxy-plan.md §5): every one, by its name and region, and whether it is
   also a public exit — an exit for everyone whose plan gives exits — switched here, apart from its being a proxy. A
   device is made one on its own Proxy & exit page; stopping one here removes everyone's endpoints on it. */
export const AdminPublicProxies: React.FC<{ onProblem: (problem: string) => void }> = ({ onProblem }) => {
  const [proxies, setProxies] = useState<PublicProxy[] | 'ERROR' | typeof UNSUPPORTED>()
  const [busy, setBusy] = useState<string>()

  const load = useCallback(async () => setProxies(await graphQLPublicProxies()), [])

  useEffect(() => {
    load()
  }, [load])

  const change = async (id: string, run: () => Promise<unknown>, failed: string) => {
    setBusy(id)
    if ((await run()) === 'ERROR') onProblem(failed)
    await load()
    setBusy(undefined)
  }

  if (proxies === undefined) return <LoadingMessage />
  if (!Array.isArray(proxies)) return null // the page above says why: no device sessions, or no reading them

  return (
    <List>
      <ListSubheader>Public proxies</ListSubheader>
      {!proxies.length && (
        <ListItem>
          <ListItemText secondary="None yet: make a device one on its Proxy & exit page." />
        </ListItem>
      )}
      {proxies.map(p => (
        <React.Fragment key={p.id}>
          <ListItem
            secondaryAction={
              <ConfirmIconButton
                icon="trash"
                title="Stop being a public proxy"
                disabled={!!busy}
                confirm
                confirmProps={{
                  title: `Stop ${p.host} being a public proxy?`,
                  children: "Everyone's endpoints on it are removed, and it is no longer anyone's exit.",
                }}
                onClick={() => change(p.id, () => graphQLRemoveRemoteitProxy(p.id), `${p.host} was not removed.`)}
              />
            }
          >
            <ListItemIcon>
              <Icon name="server" size="md" />
            </ListItemIcon>
            <ListItemText primary={p.host} secondary={`${p.region ?? 'no region'} · device ${p.id}`} />
          </ListItem>
          <ListItemSetting
            icon="right-from-bracket"
            label="Public exit"
            subLabel={
              p.publicExit === undefined
                ? 'This API cannot say whether it is one'
                : 'An exit for everyone whose plan gives exits, under the policy below'
            }
            toggle={!!p.publicExit}
            disabled={!!busy || p.publicExit === undefined}
            confirm={!!p.publicExit}
            confirmProps={{
              title: `Stop ${p.host} being a public exit?`,
              children: 'Everyone using it as their exit is moved off it.',
            }}
            onClick={() =>
              change(p.id, () => graphQLSetProxyPublicExit(p.id, !p.publicExit), `${p.host}'s exit was not changed.`)
            }
          />
        </React.Fragment>
      ))}
    </List>
  )
}

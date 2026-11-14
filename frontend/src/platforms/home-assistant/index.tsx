import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import { HOME_ASSISTANT_ADDON_REPOSITORY } from '../../constants'

// Home Assistant, through remote.it's add-on (GitHub remoteit/home-assistant-addons): the device package's device in
// Home Assistant, registered with a code pasted into the add-on's panel. A device-package platform (devicePackage.tsx),
// offered where the stage has the device. No platform type of its own: the code names none, and the device reports
// the machine's (Linux).
const Component = ({ darkMode, ...props }) => (
  <svg viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M128 24 20 124h28v104h160V124h28z" fill="#18bcf2" />
    <circle cx="128" cy="150" r="22" fill="none" stroke="#fff" strokeWidth="12" />
    <path d="M128 172v40M128 128V96" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
  </svg>
)

// Home Assistant's own link that adds a repository to its add-on store (my.home-assistant.io): the person picks their
// Home Assistant, which then asks to add it.
const addRepositoryLink = `https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=${encodeURIComponent(
  HOME_ASSISTANT_ADDON_REPOSITORY
)}`

platforms.register({
  id: 'home-assistant',
  name: 'Home Assistant',
  subtitle: 'Add-on',
  component: Component,
  installation: {
    command: '[CODE]',
    instructions: (
      // JSX instructions pass through untranslated (platforms/text.ts), as docker's and the other code-kept platforms'.
      <>
        In Home Assistant, <Link href={addRepositoryLink}>add remote.it's add-on repository</Link> (or add{' '}
        <Link href={HOME_ASSISTANT_ADDON_REPOSITORY}>{HOME_ASSISTANT_ADDON_REPOSITORY}</Link> under Settings → Add-ons →
        Add-on store → Repositories), install the remote.it add-on and start it, then open its remote.it panel and paste
        this code. It keeps itself up to date (the add-on's “Update the device automatically”, on by default). This page
        updates when the device registers.
      </>
    ),
  },
})

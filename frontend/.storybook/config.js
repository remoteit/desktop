import { configure } from '@storybook/react'
import '../src/components/App/App.css'

// automatically import all files ending in *.stories.js
const req = require.context('../src', true, /.story.(jsx?|tsx?)$/)
function loadStories() {
  req.keys().forEach(filename => req(filename))
}

configure(loadStories, module)

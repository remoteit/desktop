import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return (
    <svg viewBox="0 -10 78 80" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient x1="58.9730016%" y1="7.41201144%" x2="37.1918451%" y2="103.760174%" id="linearGradient-1">
          <stop stopColor="#114A8B" offset="0%"></stop>
          <stop stopColor="#0669BC" offset="100%"></stop>
        </linearGradient>
        <linearGradient x1="59.7172053%" y1="52.3076564%" x2="52.6903358%" y2="54.8597388%" id="linearGradient-2">
          <stop stopColor="#000000" stopOpacity="0.3" offset="0%"></stop>
          <stop stopColor="#000000" stopOpacity="0.2" offset="7.1%"></stop>
          <stop stopColor="#000000" stopOpacity="0.1" offset="32.1%"></stop>
          <stop stopColor="#000000" stopOpacity="0.05" offset="62.3%"></stop>
          <stop stopColor="#000000" stopOpacity="0" offset="100%"></stop>
        </linearGradient>
        <linearGradient x1="37.4439271%" y1="4.5125%" x2="62.6371997%" y2="99.8901042%" id="linearGradient-3">
          <stop stopColor="#3CCBF4" offset="0%"></stop>
          <stop stopColor="#2892DF" offset="100%"></stop>
        </linearGradient>
      </defs>
      <path
        d="M26.268,0 L48.878,0 L25.406,69.546 C24.912,71.012 23.538,71.998 21.99,71.998 L4.394,71.998 C2.406,71.998 0.794,70.386 0.794,68.398 C0.794,68.006 0.858,67.618 0.982,67.246 L22.852,2.454 C23.346,0.988 24.72,0 26.268,0 L26.268,0 Z"
        fill="url(#linearGradient-1)"
      ></path>
      <path
        d="M59.124,46.647996 L23.27,46.647996 C22.354,46.646 21.61,47.39 21.608,48.306 C21.608,48.768 21.798,49.208 22.136,49.522 L45.176,71.026 C45.846,71.652 46.73,72 47.648,72 L67.95,72 L59.124,46.647996 Z"
        fill="#0078D4"
      ></path>
      <path
        d="M26.268,-2.64843944e-05 C24.702,-0.006 23.316,1.008 22.844,2.5 L1.01,67.19 C0.34,69.058 1.312,71.118 3.18,71.788 C3.572,71.928 3.986,72 4.404,72 L22.456,72 C23.824,71.756 24.956,70.794 25.418,69.482 L29.772,56.65 L45.324,71.156 C45.976,71.696 46.794,71.994 47.64,72 L67.868,72 L58.996,46.648 L33.134,46.654 L48.96,-2.64843944e-05 L26.268,-2.64843944e-05 Z"
        fill="url(#linearGradient-2)"
      ></path>
      <path
        d="M55.148,2.45 C54.654,0.986 53.282,0 51.736,0 L26.536,0 C28.08,0 29.454,0.986 29.946,2.448 L51.816,67.246 C52.452,69.13 51.44,71.172 49.556,71.808 C49.186,71.936 48.798,72 48.406,72 L73.606,72 C75.594,72 77.206,70.388 77.206,68.398 C77.206,68.006 77.142,67.618 77.016,67.248 L55.148,2.45 Z"
        fill="url(#linearGradient-3)"
      ></path>
    </svg>
  )
}

platforms.register({
  id: 'azure',
  name: 'Azure',
  component: Component,
  types: { 1209: 'Azure' },
  installation: {
    command: true,
    qualifier: 'For any Linux based Azure Cloud virtual machine',
    link: 'https://link.remote.it/support/streamline-install',
  },
})

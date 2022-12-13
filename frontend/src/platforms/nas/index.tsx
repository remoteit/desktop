import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  const light = darkMode ? '#444' : '#bbb'
  const dark = '#808080'
  return (
    <svg viewBox="0 0 255 236" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g id="nas">
        <path
          d="M253.1196,70.7936 L1.0286,70.0756 C1.0286,70.0756 26.9596,13.2166 29.5146,9.7896 C34.3266,3.3356 40.6076,-0.0294 49.0706,0.000401151803 C101.1576,0.1876 153.2456,0.1406 205.3326,0.0546 C213.1966,0.0416 219.1026,3.3966 223.4416,9.5696 C226.2876,13.6196 253.1196,70.7936 253.1196,70.7936"
          fill={light}
        ></path>
        <path
          d="M28.2583,235.3677 C15.4553,235.2577 6.6603,228.7747 2.1793,217.4497 C-0.0277,211.8717 0.0333,205.1757 0.0223,198.9847 C-0.0537,158.1797 0.0713,117.3737 0.3373,76.5697 C0.3583,73.2327 1.3143,69.5947 2.8573,66.6287 C8.5573,55.6717 17.5833,50.3527 30.2333,50.3737 C94.9353,50.4827 159.6373,50.3237 224.3393,50.2656875 C240.2423,50.2517 253.1673,61.9657 254.2303,77.8747 C254.3503,79.6717 254.2303,159.9067 254.2303,198.4237 C254.0173,201.6937 253.6503,204.9617 253.6173,208.2337 C253.4803,222.0227 240.8723,234.8877 227.1183,235.3017 C220.2143,235.5097 34.5213,235.4217 28.2583,235.3677"
          fill={dark}
        ></path>
        <path
          d="M33.9832,109.010115 C25.4232,108.978 18.9332,102.423 19.0562,93.933 C19.1762,85.706 25.4312,79.295 33.3682,79.2648801 C42.0112,79.233 48.7992,85.609 48.9102,93.864 C49.0252,102.375 42.4552,109.042 33.9832,109.010115"
          fill={light}
        ></path>
        <path
          d="M119.1472,143.1311 C119.1472,162.9191 119.1532,182.7071 119.1442,202.4951 C119.1402,211.2101 115.2842,214.9951 106.4102,215.0631 C100.0032,215.1131 93.5962,215.2351 87.1892,215.227475 C79.5072,215.2181 74.9472,210.6771 74.9432,202.9831 C74.9192,163.0301 74.9202,123.0771 74.9412,83.1241 C74.9462,75.5411 78.9502,71.2061 86.6312,70.9501 C93.7802,70.7121 100.9542,70.7561 108.1002,71.0691 C115.4032,71.3891 119.0582,75.2901 119.0912,82.6371 C119.1822,102.8011 119.1232,122.9661 119.1232,143.1311 C119.1312,143.1311 119.1392,143.1311 119.1472,143.1311"
          fill={light}
        ></path>
        <path
          d="M230.3171,142.5914 C230.3171,162.3674 230.3371,182.1434 230.3081,201.9194 C230.2951,210.6824 225.8811,215.1384 217.2211,215.1944 C211.0061,215.2354 204.7901,215.2414 198.5751,215.1924 C190.5881,215.1294 185.8211,210.5574 185.8121,202.7224 C185.7701,162.9814 185.7711,123.2394 185.8111,83.4984 C185.8191,75.5514 189.8851,71.3694 197.8321,71.1074 C204.4181,70.8894 211.0161,70.7504 217.6011,70.9064 C226.4581,71.1154 230.1341,75.0474 230.1371,83.8274 C230.1431,103.4154 230.1391,123.0034 230.1391,142.5914 C230.1981,142.5914 230.2581,142.5914 230.3171,142.5914"
          fill={light}
        ></path>
        <path
          d="M174.4869,143.1776 C174.4869,163.1466 174.4939,183.1156 174.4839,203.0846 C174.4799,210.6796 170.4799,214.9016 162.8229,215.0696 C155.8569,215.2236 148.8819,215.2056 141.9159,215.0486 C134.6819,214.8866 130.8839,211.1316 130.7209,203.7166 C130.4929,193.3596 130.5519,182.9956 130.5519,172.6336 C130.5549,143.4336 130.5549,114.2336 130.6299,85.0336 C130.6579,74.3216 133.6169,71.2816 144.3539,70.9816 C150.7509,70.8036 157.1699,70.7726 163.5589,71.0886 C170.7319,71.4416 174.4709,75.5226 174.4929,82.7056 C174.5529,102.8626 174.5139,123.0206 174.5139,143.1776 L174.4869,143.1776 Z"
          fill={light}
        ></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'nas',
  name: 'Synology',
  component: Component,
  types: { 1210: 'Synology' },
  installation: {
    instructions: 'Download the package file and install it through your NAS web interface.',
    qualifier: 'Synology manual installation',
    link: 'https://link.remote.it/download/synology',
  },
})

import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, currentColor, ...props }) => {
  const color = currentColor ? 'currentColor' : '#1699D6'
  return (
    <svg viewBox="0 0 207 154" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M206.319388,23.0940837 L206.319388,124.882771 C206.09006,131.386238 203.78646,136.789927 199.45946,141.116927 C195.132523,145.443864 189.728919,147.747454 183.225511,147.97772 L126.32962,147.97772 C133.949897,141.265565 140.214779,134.290133 145.166992,127.109631 L183.075115,127.109125 C183.809104,127.05332 184.431478,126.913847 184.843929,126.501396 C185.256376,126.088949 185.39585,125.466581 185.451657,124.7326 L185.451657,23.2442555 C185.39585,22.5102737 185.256376,21.8879062 184.843929,21.4754587 C184.431481,21.0630113 183.809114,20.9235378 183.075132,20.8677311 L40.9118681,20.8677311 C40.1778864,20.9235378 39.5555188,21.0630113 39.1430714,21.4754587 C38.7306093,21.8879208 38.5911406,22.5103179 38.5353378,23.2443336 L38.5346104,35.4254798 C30.7745732,39.1162087 23.8242225,43.5531985 17.6665486,48.7128298 L17.6665486,23.0938287 C17.8970311,16.5904347 20.2006185,11.1868498 24.5275405,6.85992782 C28.8545406,2.53292768 34.2582295,0.229328015 40.7616964,0 L183.225304,0 C189.728771,0.229328015 195.13246,2.53292768 199.45946,6.85992782 C203.78646,11.186928 206.09006,16.5906168 206.319388,23.0940837 Z M71.7024812,43.1432801 C61.6395442,43.3082463 52.6490221,45.2878108 44.7306454,49.082033 C36.8122687,52.8762552 29.883793,57.5777208 23.9450104,63.186571 C18.171194,68.630455 13.3872465,74.2392211 9.59302436,80.0130374 C5.79880218,85.7868538 2.99441915,90.9832106 1.17979115,95.6022636 C0.354960245,97.5818578 0.354960245,99.5614223 1.17979115,101.541016 C2.99441915,106.16007 5.79880218,111.356426 9.59302436,117.130243 C13.3872465,122.904059 18.171194,128.512825 23.9450104,133.956709 C29.883793,139.565559 36.8122687,144.267025 44.7306454,148.061247 C52.6490221,151.855469 61.6395442,153.835034 71.7024812,154 C81.7654183,153.835034 90.7559404,151.855469 98.6743171,148.061247 C106.592694,144.267025 113.52117,139.565559 119.459952,133.956709 C125.233768,128.512825 130.017716,122.904059 133.811938,117.130243 C137.60616,111.356426 140.493025,106.16007 142.472619,101.541016 C143.29745,99.5614223 143.29745,97.5818578 142.472619,95.6022636 C140.493025,90.9832106 137.60616,85.7868538 133.811938,80.0130374 C130.017716,74.2392211 125.233768,68.630455 119.459952,63.186571 C113.52117,57.5777208 106.592694,52.8762552 98.6743171,49.082033 C90.7559404,45.2878108 81.7654183,43.3082463 71.7024812,43.1432801 Z M36.0699641,98.5716401 C36.0699641,92.137959 37.6371194,86.1992655 40.7714768,80.7553815 C43.9058343,75.3114975 48.2773725,70.9399593 53.8862227,67.6406356 C59.4950729,64.5062782 65.4337663,62.939123 71.7024812,62.939123 C77.9711962,62.939123 83.9098896,64.5062782 89.5187398,67.6406356 C95.12759,70.9399593 99.4991282,75.3114975 102.633486,80.7553815 C105.767843,86.1992655 107.334998,92.137959 107.334998,98.5716401 C107.334998,105.005321 105.767843,110.944015 102.633486,116.387899 C99.4991282,121.831783 95.12759,126.203321 89.5187398,129.502644 C83.9098896,132.637002 77.9711962,134.204157 71.7024812,134.204157 C65.4337663,134.204157 59.4950729,132.637002 53.8862227,129.502644 C48.2773725,126.203321 43.9058343,121.831783 40.7714768,116.387899 C37.6371194,110.944015 36.0699641,105.005321 36.0699641,98.5716401 Z M71.7024812,82.7349658 C71.7024812,80.9203378 71.4550357,79.2707007 70.9601371,77.7860051 C70.6302048,76.1363433 71.2075778,75.146561 72.6922734,74.8166287 C77.806225,75.146561 82.4252088,76.87868 86.5493634,80.0130374 C90.5085517,83.1473949 93.2304529,87.2714875 94.7151485,92.3854392 C96.1998442,98.9840865 95.3750256,105.005262 92.2406682,110.449146 C89.1063107,115.89303 84.3223632,119.604713 77.8886821,121.584307 C71.2900349,123.069003 65.2688595,122.244184 59.8249755,119.109827 C54.3810915,115.97547 50.6694081,111.191522 48.689814,104.757841 C48.1949154,102.943213 47.9474698,101.211094 47.9474698,99.5614322 C48.2774022,98.0767366 49.2671845,97.4993636 50.9168463,97.829296 C52.4015419,98.3241945 54.051179,98.5716401 55.865807,98.5716401 C60.3198939,98.4066739 64.0315773,96.8395187 67.0009686,93.8701274 C69.9703598,90.9007361 71.5375151,87.1890527 71.7024812,82.7349658 Z"
        fill={color}
      ></path>
    </svg>
  )
}

platforms.register({
  id: 'android-screenview',
  name: 'Android screen-view extension',
  hidden: true,
  component: Component,
  types: { 1213: 'Android screen-view' },
  services: [{ application: 48 }],
  installation: {
    label: 'Registration Code',
    command: '[CODE]',
    qualifier: 'For Android screen-view',
  },
})

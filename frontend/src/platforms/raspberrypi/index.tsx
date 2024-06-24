import React from 'react'
import { Typography } from '@mui/material'
import { platforms } from '..'
import { TestUI } from '../../components/TestUI'
import { Icon } from '../../components/Icon'

const Component = ({ darkMode, ...props }) => {
  const berry = '#cd2355'
  const leaf = '#75A928'
  return (
    <svg viewBox="0 0 562 717" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g stroke="none">
        <path
          d="M152.375,0.65625 C148.7557,0.7685692 144.85785,2.1055766 140.4375,5.59375 C129.61054,1.4174496 119.11041,-0.0334388 109.71875,8.46875 C95.22489,6.5879922 90.508461,10.469494 86.9375,15 C83.754953,14.934135 63.118652,11.72793 53.65625,25.84375 C29.874602,23.030329 22.359472,39.831625 30.875,55.5 C26.018089,63.018955 20.985497,70.447226 32.34375,84.78125 C28.325744,92.764764 30.816319,101.42528 40.28125,111.90625 C37.783393,123.12885 42.693327,131.04711 51.5,137.21875 C49.85291,152.57631 65.583505,161.50618 70.28125,164.6875 C72.084927,173.63618 75.84416,182.0802 93.8125,186.75 C96.77573,200.0861 107.57456,202.38906 118.03125,205.1875 C83.469321,225.27704 53.83058,251.71016 54.03125,316.5625 L48.96875,325.59375 C9.337882,349.69604 -26.316547,427.16001 29.4375,490.125 C33.079371,509.83338 39.187089,523.98896 44.625,539.65625 C52.758834,602.78683 105.84263,632.34786 119.84375,635.84375 C140.36028,651.47187 162.21193,666.30047 191.78125,676.6875 C219.6564,705.43696 249.85513,716.3939 280.21875,716.377161 C280.6639,716.377161 281.11728,716.377161 281.5625,716.377161 C311.92613,716.3939 342.12485,705.43696 370,676.6875 C399.56932,666.30047 421.42097,651.47187 441.9375,635.84375 C455.93862,632.34786 509.02242,602.78683 517.15625,539.65625 C522.59416,523.98896 528.70187,509.83338 532.34375,490.125 C588.09779,427.16001 552.44336,349.69604 512.8125,325.59375 L507.75,316.5625 C507.95067,251.71016 478.31193,225.27704 443.75,205.1875 C454.20669,202.38906 465.00552,200.0861 467.96875,186.75 C485.93709,182.0802 489.69633,173.63618 491.5,164.6875 C496.19775,161.50618 511.92834,152.57631 510.28125,137.21875 C519.08793,131.04711 523.99786,123.12885 521.5,111.90625 C530.96494,101.42528 533.4555,92.764763 529.4375,84.78125 C540.79575,70.447226 535.76316,63.018955 530.90625,55.5 C539.42178,39.831625 531.90665,23.030329 508.125,25.84375 C498.6626,11.72793 478.0263,14.934135 474.84375,15 C471.27279,10.469494 466.55636,6.587992 452.0625,8.46875 C442.67084,-0.03343868 432.17071,1.41745 421.34375,5.59375 C408.48455,-4.5536631 399.97149,3.580454 390.25,6.65625 C374.67615,1.568472 371.11698,8.5371578 363.46875,11.375 C346.4935,7.7869238 341.33315,15.598532 333.1875,23.84375 L323.71875,23.65625 C298.10821,38.749365 285.38497,69.481751 280.875,85.28125 C276.36294,69.479271 263.66853,38.746708 238.0625,23.65625 L228.59375,23.84375 C220.4481,15.598532 215.28775,7.7869235 198.3125,11.375 C190.66427,8.5371583 187.1051,1.5684729 171.53125,6.65625 C165.15152,4.6377589 159.28458,0.4418224 152.375,0.65625 Z"
          fill="#24010b"
        ></path>
        <path
          d="M101.39184,67.055583 C169.33951,102.08694 208.83873,130.42455 230.47901,154.56005 C219.39666,198.97764 161.58263,201.00469 140.44342,199.75863 C144.77184,197.74389 148.3833,195.33085 149.66393,191.62289 C144.35944,187.85308 125.55104,191.2257 112.4203,183.84873 C117.46437,182.80374 119.82378,181.78571 122.18319,178.06331 C109.77748,174.10661 96.41457,170.69689 88.555444,164.14215 C92.796697,164.19455 96.7566,165.09095 102.29581,161.24944 C91.184116,155.26125 79.326702,150.51593 70.11442,141.36206 C75.859633,141.22143 82.053872,141.30526 83.854791,139.19253 C73.684351,132.89185 65.103549,125.88466 58.001199,118.22038 C66.041178,119.1909 69.436483,118.35516 71.379981,116.95482 C63.692186,109.08063 53.962422,102.43163 49.32307,92.72838 C55.292676,94.785864 60.754319,95.57344 64.69059,92.547585 C62.078225,86.654132 50.885177,83.177967 44.441623,69.405909 C50.725982,70.015286 57.391229,70.777017 58.724376,69.405909 C55.802068,57.517346 50.796919,50.835885 45.887978,43.913906 C59.338021,43.714177 79.715734,43.966253 78.792549,42.82914 L70.476009,34.331805 C83.613626,30.794564 97.05666,34.899969 106.81567,37.947692 C111.19753,34.490011 106.73807,30.117712 101.39184,25.653677 C112.5568,27.144323 122.64566,29.711066 131.76529,33.247039 C136.63767,28.84771 128.6014,24.448381 124.71431,20.049052 C141.96367,23.32162 149.27147,27.919732 156.53412,32.523862 C161.80347,27.473063 156.83578,23.180563 153.27982,18.783491 C166.28548,23.600539 172.9846,29.819042 180.03738,35.958954 C182.42857,32.731901 186.11232,30.366546 181.66453,22.580173 C190.89869,27.902898 197.85379,34.175233 202.99827,41.20199 C208.71163,37.564049 206.40214,32.588967 206.43336,28.004003 C216.03001,35.810519 222.12023,44.117953 229.57504,52.230446 C231.07673,51.137009 232.39165,47.428736 233.55251,41.563579 C256.4479,63.775394 288.79842,119.72182 241.86905,141.90444 C201.95028,108.95728 154.25292,85.016909 101.39184,67.055583 Z"
          fill={leaf}
        ></path>
        <path
          d="M461.92487,67.055583 C393.9772,102.08694 354.47798,130.42455 332.8377,154.56005 C343.92005,198.97764 401.73408,201.00469 422.87329,199.75863 C418.54487,197.74389 414.93341,195.33085 413.65278,191.62289 C418.95727,187.85308 437.76567,191.2257 450.89641,183.84873 C445.85234,182.80374 443.49293,181.78571 441.13352,178.06331 C453.53923,174.10661 466.90214,170.69689 474.76127,164.14215 C470.52001,164.19455 466.56011,165.09095 461.0209,161.24944 C472.13259,155.26125 483.99001,150.51593 493.20229,141.36206 C487.45708,141.22143 481.26284,141.30526 479.46192,139.19253 C489.63236,132.89185 498.21316,125.88466 505.31551,118.22038 C497.27553,119.1909 493.88023,118.35516 491.93673,116.95482 C499.62452,109.08063 509.35429,102.43163 513.99364,92.72838 C508.02403,94.785864 502.56239,95.57344 498.62612,92.547585 C501.23849,86.654132 512.43153,83.177967 518.87509,69.405909 C512.59073,70.015286 505.92548,70.777017 504.59233,69.405909 C507.51464,57.517346 512.51979,50.835885 517.42873,43.913906 C503.97869,43.714177 483.60098,43.966256 484.52416,42.82914 L492.8407,34.331805 C479.70308,30.794564 466.26005,34.899969 456.50104,37.947692 C452.11918,34.490011 456.57864,30.117712 461.92487,25.653677 C450.75991,27.144323 440.67105,29.711066 431.55142,33.247039 C426.67904,28.84771 434.71531,24.448381 438.6024,20.049052 C421.35304,23.32162 414.04524,27.919732 406.78259,32.523862 C401.51324,27.473063 406.48093,23.180563 410.03689,18.783491 C397.03123,23.600539 390.33211,29.819042 383.27933,35.958954 C380.88814,32.731901 377.20439,30.366546 381.65218,22.580173 C372.41802,27.902898 365.46292,34.175233 360.31844,41.20199 C354.60508,37.564049 356.91457,32.588967 356.88335,28.004003 C347.2867,35.810519 341.19648,44.117953 333.74167,52.230446 C332.23998,51.137009 330.92506,47.428736 329.7642,41.563579 C306.86881,63.775394 274.51829,119.72182 321.44766,141.90444 C361.36643,108.95728 409.06379,85.016909 461.92487,67.055583 L461.92487,67.055583 Z"
          fill={leaf}
        ></path>
        <path
          d="M363.946344,519.361042 C363.946344,560.810986 327.506751,594.412805 282.556234,594.412805 C237.605717,594.412805 201.166123,560.810986 201.166123,519.361042 C201.166123,477.911098 237.605717,444.30928 282.556234,444.30928 C327.506751,444.30928 363.946344,477.911098 363.946344,519.361042 Z"
          fill={berry}
        ></path>
        <path
          d="M274.098064,376.818554 C274.098064,417.135814 235.537262,449.819411 187.970102,449.819411 C140.402942,449.819411 101.842139,417.135814 101.842139,376.818554 C101.842139,336.501294 140.402942,303.817697 187.970102,303.817697 C235.537262,303.817697 274.098064,336.501294 274.098064,376.818554 Z"
          fill={berry}
          transform="translate(187.970102, 376.818554) rotate(-56.610902) translate(-187.970102, -376.818554) "
        ></path>
        <path
          d="M460.098081,372.818554 C460.098081,413.135814 421.537278,445.819411 373.970118,445.819411 C326.402958,445.819411 287.842156,413.135814 287.842156,372.818554 C287.842156,332.501294 326.402958,299.817697 373.970118,299.817697 C421.537278,299.817697 460.098081,332.501294 460.098081,372.818554 Z"
          fill={berry}
          transform="translate(373.970118, 372.818554) scale(-1, 1) rotate(-56.610902) translate(-373.970118, -372.818554) "
        ></path>
        <path
          d="M66.910253,341.0878 C103.32447,331.33088 79.201845,491.72431 49.576871,478.56357 C16.990103,452.35089 6.493801,375.58814 66.910253,341.0878 Z"
          fill={berry}
        ></path>
        <path
          d="M487.67828,339.0878 C451.26406,329.33088 475.38668,489.72431 505.01166,476.56357 C537.59843,450.35089 548.09473,373.58814 487.67828,339.0878 Z"
          fill={berry}
        ></path>
        <path
          d="M363.97158,219.6534 C426.80644,209.04327 479.08752,246.37569 476.98296,314.51136 C474.91603,340.63248 340.82424,223.54229 363.97158,219.6534 L363.97158,219.6534 Z"
          fill={berry}
        ></path>
        <path
          d="M190.35975,217.6534 C127.52489,207.04327 75.24381,244.37569 77.34837,312.51136 C79.4153,338.63248 213.50709,221.54229 190.35975,217.6534 Z"
          fill={berry}
        ></path>
        <path
          d="M280.61932,201.75568 C243.11673,200.7802 207.12384,229.58986 207.037465,246.30011 C206.93312,266.60437 236.68894,287.39277 280.875,287.92046 C325.99805,288.24367 354.79061,271.27997 354.936593,250.32637 C355.10094,226.58641 313.89731,201.38893 280.61932,201.75568 L280.61932,201.75568 Z"
          fill={berry}
        ></path>
        <path
          d="M282.90937,618.11675 C315.60681,616.68964 359.4802,628.64871 359.56617,644.51273 C360.10887,659.91793 319.77648,694.72328 280.73983,694.05038 C240.31254,695.79429 200.67075,660.93479 201.19032,648.85179 C200.58526,631.13586 250.41632,617.30383 282.90937,618.11675 Z"
          fill={berry}
        ></path>
        <path
          d="M162.13874,524.10369 C185.41784,552.14942 196.0294,601.42268 176.60229,615.94722 C158.22312,627.03506 113.59001,622.46884 81.866053,576.89565 C60.471001,538.65397 63.228469,499.73902 78.250166,488.30641 C100.71459,474.62212 135.42359,493.10543 162.13874,524.10369 Z"
          fill={berry}
        ></path>
        <path
          d="M399.0209,515.21177 C373.83408,544.71342 359.80863,598.52128 378.18305,615.85457 C395.75133,629.31818 442.91225,627.43619 477.74871,579.09883 C503.0447,546.63412 494.56884,492.41658 480.11948,478.02372 C458.6554,461.42159 427.84257,482.66861 399.0209,515.21177 L399.0209,515.21177 Z"
          fill={berry}
        ></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'raspberrypi',
  name: 'Raspberry Pi',
  component: Component,
  // route: '/add/raspberrypi-options',
  types: { 1072: 'Raspberry Pi', 1075: 'Remote.It Pi', 1076: 'Remote.It Pi Lite', 1077: 'Remote.It Pi 64' },
  listItemTitle: (
    <>
      Raspberry Pi &nbsp;
      <TestUI>
        <Typography variant="caption" component="div">
          <Icon name="bluetooth" size="sm" color="grayDarker" />
          &nbsp;WiFi Onboarding
        </Typography>
      </TestUI>
    </>
  ),
  installation: {
    command: true,
    qualifier: 'For any Raspberry Pi or Linux based system',
    link: 'https://link.remote.it/support/streamline-install',
    altLink: 'https://link.remote.it/docs/oem-overview',
  },
})

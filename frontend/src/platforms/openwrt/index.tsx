import React from 'react'
import platforms from '..'

const Component = ({ darkMode, ...props }) => {
  return (
    <svg viewBox="0 0 242 291" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        <path
          d="M120.961628,151.422176 C110.087505,151.422176 101.237008,160.272673 101.237008,171.146796 C101.237008,182.020919 110.087505,190.871416 120.961628,190.871416 C131.835751,190.871416 140.686248,182.020919 140.686248,171.146796 C140.686248,160.272673 131.835751,151.422176 120.961628,151.422176 Z"
          fill={darkMode ? '#FFFFFF' : '#43B0E8'}
        ></path>
        <path
          d="M0,50.1859095 L20.5035251,70.6894346 C46.2379309,44.9473925 81.7697381,29.010388 120.959344,29.010388 C160.148949,29.010388 195.680756,44.9473925 221.422799,70.6894346 L241.926324,50.1859095 C210.938128,19.197714 168.144179,0 120.959344,0 C73.7821451,0 30.9958318,19.197714 0,50.1859095 Z"
          fill={darkMode ? '#FFFFFF' : '#43B0E8'}
        ></path>
        <path
          d="M36.9063478,87.0892077 L57.4098729,107.592733 C73.6905118,91.3120939 96.1718444,81.2245122 120.959346,81.2245122 C145.754484,81.2245122 168.235817,91.3120939 184.516456,107.592733 L205.019981,87.0892077 C183.485552,65.5547791 153.749714,52.2141242 120.959346,52.2141242 C88.1689787,52.2141242 58.4407764,65.5547791 36.9063478,87.0892077 Z"
          fill={darkMode ? '#FFFFFF' : '#43B0E8'}
        ></path>
        <path
          d="M73.8088718,123.993258 L94.3123969,144.496783 C101.139269,137.669911 110.562491,133.439388 120.963161,133.439388 C131.363832,133.439388 140.787054,137.669911 147.613926,144.496783 L168.117451,123.993258 C156.036789,111.912596 139.351425,104.429 120.963161,104.429 C102.567261,104.429 85.8895335,111.912596 73.8088718,123.993258 Z"
          fill={darkMode ? '#FFFFFF' : '#43B0E8'}
        ></path>
        <path
          d="M193.603688,118.230137 C204.454902,133.09042 210.884685,151.379411 210.884685,171.14985 C210.884685,220.73249 170.541995,261.067543 120.959355,261.067543 C71.3767147,261.067543 31.0340245,220.73249 31.0340245,171.14985 C31.0340245,151.379411 37.4638078,133.09042 48.3226579,118.230137 L27.6434974,97.5509762 C11.6224935,117.817775 2.03127277,143.376546 2.03127277,171.14985 C2.03127277,236.722948 55.3786197,290.077931 120.959355,290.077931 C186.54009,290.077931 239.895073,236.722948 239.895073,171.14985 C239.895073,143.376546 230.296216,117.817775 214.282848,97.5509762 L193.603688,118.230137 Z"
          fill={darkMode ? '#43B0E8' : '#072342'}
        ></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'openwrt',
  name: 'OpenWrt',
  component: Component,
  types: { 1205: 'OpenWrt' },
})

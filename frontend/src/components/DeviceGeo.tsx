import React from 'react'

export const DeviceGeo: React.FC<{ geo?: IDevice['geo'] }> = ({ geo }) => {
  if (!geo) return null
  return (
    <>
      {geo.city && (
        <>
          {geo.city}
          <br />
        </>
      )}
      {geo.stateName && (
        <>
          {geo.stateName}
          <br />
        </>
      )}
      {geo.countryName && geo.countryName}
    </>
  )
}

import React from 'react'
import { AnnouncementCard } from './AnnouncementCard'

export const AnnouncementCardTest: React.FC<{ hide?: boolean }> = ({ hide }) => {
  if (hide) return null
  return (
    <AnnouncementCard
      data={{
        id: '1',
        type: 'COMMUNICATION',
        title: 'Join us at Channel Partners Expo',
        link: 'https://www.embeddedworks.net/partners/remoteit/',
        body: (
          <>
            <h4>
              &#x1F5D3;&#xFE0F; &nbsp; March 12 - 14 <br />
              &#x1F4CD; &nbsp; The Venetian, Las Vegas <br />
              &#x1F44B; &nbsp; Visit Us at Booth 1156!
            </h4>
            <p>
              Discover our new ScreenView for Android, and explore innovative connectivity solutions with the Remote.It
              team!
            </p>
            <h4>Get your free Expo + Keynote Pass</h4>
            <ol>
              <li>
                Visit the
                <a href="https://channelpartnersconference.com/" target="_blank">
                  Expo website
                </a>
              </li>
              <li>
                Click on <i>Register</i>
              </li>
              <li>Login/Create an Account</li>
              <li>
                Select the <i>$350 Expo + Keynote Pass</i> option <br />
                <cite>business type VAR only</cite>
              </li>
              <li>
                Enter the promo code <b>EMBEDDED</b> at checkout
              </li>
            </ol>
          </>
        ),
        image: '',
      }}
    />
  )
}

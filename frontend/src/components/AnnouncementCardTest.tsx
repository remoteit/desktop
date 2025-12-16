import React from 'react'
import { AnnouncementCard } from './AnnouncementCard'

export const AnnouncementCardTest: React.FC<{ hide?: boolean }> = ({ hide }) => {
  if (hide) return null
  return (
    <>
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
                Discover our new ScreenView for Android, and explore innovative connectivity solutions with the
                Remote.It team!
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
      <AnnouncementCard
        data={{
          id: '2',
          type: 'COMMUNICATION',
          title: 'Holiday Hours Notice',
          body: (
            <>
              <p>
                Remote.it will operate with reduced support hours from <b>December 20, 2025</b> through{' '}
                <b>January 4, 2026</b>. We will resume regular business hours on <b>January 5, 2026</b>.
              </p>
              <p>
                <em>
                  <b>Wishing you a happy holiday season and a wonderful New Year!</b>
                </em>
              </p>
            </>
          ),
          // For testing purposes, you should place the image file in the project's public or src directory and reference it with a relative or absolute URL from the dev server.
          // Directly linking to an absolute file system path like the one below will NOT work in a web environment.
          // Example with public directory (move image to `public/holiday-2025.png`):
          image: '/holiday-2025.png',
        }}
      />
    </>
  )
}

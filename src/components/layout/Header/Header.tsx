'use client'

import React from 'react'
import { AnnouncementBar } from './AnnouncementBar'
import { MainNavbar } from './MainNavbar'
import { UspBar } from './UspBar'

export function Header() {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <AnnouncementBar />
      <MainNavbar />
      <UspBar />
    </header>
  )
}

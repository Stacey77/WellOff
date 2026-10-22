'use client'

import { useState } from 'react'
import { UserRole } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import TonRadarDashboard from '@/components/tonradar/TonRadarDashboard'

export default function TonRadarPage() {
  const [role, setRole] = useState<UserRole>('agent')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={role} onRoleChange={setRole} />
        <main className="flex-1 overflow-hidden p-6">
          <TonRadarDashboard role={role} />
        </main>
      </div>
    </div>
  )
}

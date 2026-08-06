import { TopBar } from '@/components/layout/TopBar'
import { RightPanel } from '@/components/layout/RightPanel'
import { ViewportPlaceholder } from '@/components/layout/ViewportPlaceholder'
import { BottomPanel } from '@/components/layout/BottomPanel'

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <ViewportPlaceholder />
          <BottomPanel />
        </div>
        <RightPanel />
      </div>
    </div>
  )
}

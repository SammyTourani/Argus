import '@/styles/workspace-v2.css'
import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserProvider } from '@/components/providers/UserProvider'
import WorkspaceClientShell from '@/components/workspace-v2/WorkspaceClientShell'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/sign-in')

  return (
    <UserProvider user={user}>
      <WorkspaceClientShell>
        {children}
      </WorkspaceClientShell>
    </UserProvider>
  )
}

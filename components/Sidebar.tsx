import { createClient } from '@/utils/supabase/server'
import SidebarClientContent from './SidebarClientContent'

export default async function Sidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <SidebarClientContent user={user} />
}

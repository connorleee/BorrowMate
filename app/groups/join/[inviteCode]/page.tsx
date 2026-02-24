import { getGroupByInviteCode, joinGroupByInviteCode } from '@/app/groups/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function JoinGroupPage({ params }: { params: Promise<{ inviteCode: string }> }) {
    const { inviteCode } = await params
    const result = await getGroupByInviteCode(inviteCode)

    if ('error' in result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-bold mb-4">Invalid Invite Link</h1>
                    <p className="text-[var(--text-secondary)] mb-6">
                        This invite link is invalid or has expired. Please ask the group owner for a new link.
                    </p>
                    <Link
                        href="/groups"
                        className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                    >
                        Go to My Groups
                    </Link>
                </div>
            </div>
        )
    }

    const { group, isMember } = result

    if (isMember) {
        redirect(`/groups/${group.id}`)
    }

    async function handleJoin() {
        'use server'
        const joinResult = await joinGroupByInviteCode({ inviteCode })
        if (joinResult?.serverError) {
            // In a real app, we'd show this error to the user
            return
        }
        if (joinResult?.data?.groupId) {
            redirect(`/groups/${joinResult.data.groupId}`)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="max-w-md w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-8 shadow-sm">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">Join Group</h1>
                    <p className="text-[var(--text-secondary)]">You've been invited to join a group</p>
                </div>

                <div className="border-t border-b border-[var(--border)] py-6 mb-6">
                    <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
                    {group.description && (
                        <p className="text-[var(--text-secondary)] mb-4">{group.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{group.memberCount}</span>
                            <span>{group.memberCount === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${group.privacy === 'public'
                                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                                }`}>
                                {group.privacy}
                            </span>
                        </div>
                    </div>
                </div>

                <form action={handleJoin} className="space-y-4">
                    <button
                        type="submit"
                        className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                    >
                        Join Group
                    </button>
                    <Link
                        href="/groups"
                        className="block text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        Cancel
                    </Link>
                </form>
            </div>
        </div>
    )
}

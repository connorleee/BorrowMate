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
                    <p className="text-gray-600 mb-6">
                        This invite link is invalid or has expired. Please ask the group owner for a new link.
                    </p>
                    <Link
                        href="/groups"
                        className="inline-block bg-foreground text-background px-6 py-3 rounded-lg font-medium"
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
        const joinResult = await joinGroupByInviteCode(inviteCode)
        if ('error' in joinResult) {
            // In a real app, we'd show this error to the user
            console.error(joinResult.error)
            return
        }
        if (joinResult.groupId) {
            redirect(`/groups/${joinResult.groupId}`)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="max-w-md w-full bg-white border rounded-lg p-8 shadow-sm">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">Join Group</h1>
                    <p className="text-gray-600">You've been invited to join a group</p>
                </div>

                <div className="border-t border-b py-6 mb-6">
                    <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
                    {group.description && (
                        <p className="text-gray-600 mb-4">{group.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{group.memberCount}</span>
                            <span>{group.memberCount === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${group.privacy === 'public'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                {group.privacy}
                            </span>
                        </div>
                    </div>
                </div>

                <form action={handleJoin} className="space-y-4">
                    <button
                        type="submit"
                        className="w-full bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Join Group
                    </button>
                    <Link
                        href="/groups"
                        className="block text-center text-gray-600 hover:text-gray-900"
                    >
                        Cancel
                    </Link>
                </form>
            </div>
        </div>
    )
}

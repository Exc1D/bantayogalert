import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { getMunicipalityName } from '../../data/municipalities'
import { Spinner } from '../common/Spinner'

export function ProfileView() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You must be signed in to view your profile.</p>
      </div>
    )
  }

  const roleLabel = {
    citizen: 'Citizen',
    municipal_admin: 'Municipal Admin',
    provincial_superadmin: 'Provincial Superadmin',
  }[user.role ?? 'citizen']

  const roleBadgeVariant =
    user.role === 'provincial_superadmin'
      ? 'warning'
      : user.role === 'municipal_admin'
      ? 'info'
      : 'success'

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
          {user.displayName ? user.displayName[0]?.toUpperCase() ?? '👤' : '👤'}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user.displayName ?? 'Unknown User'}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Role and municipality */}
      <Card>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Role</span>
            <Badge variant={roleBadgeVariant}>{roleLabel}</Badge>
          </div>
          {user.municipality && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Municipality</span>
              <span className="text-sm font-medium">
                {getMunicipalityName(user.municipality as Parameters<typeof getMunicipalityName>[0])}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">User ID</span>
            <span className="text-xs font-mono text-gray-400">{user.uid}</span>
          </div>
        </div>
      </Card>

      {/* Sign out */}
      <Button variant="secondary" className="w-full">
        Sign Out
      </Button>
    </div>
  )
}

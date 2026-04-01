{/* Phase 4: Replace with full NavRail implementation */}
export function NavRail() {
  return (
    <aside className="w-16 h-screen bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4">
      {/* Logo */}
      <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold">
        BA
      </div>

      {/* Navigation items - Phase 4 */}
      <nav className="flex-1 flex flex-col gap-2 mt-4">
        {['feed', 'map', 'alerts', 'profile'].map((item) => (
          <button
            key={item}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors capitalize"
            aria-label={item}
          >
            {item === 'feed' && '📋'}
            {item === 'map' && '📍'}
            {item === 'alerts' && '🔔'}
            {item === 'profile' && '👤'}
          </button>
        ))}
      </nav>

      {/* Admin section - Phase 4 */}
      <div className="mt-auto">
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="admin"
        >
          ⚙️
        </button>
      </div>
    </aside>
  )
}

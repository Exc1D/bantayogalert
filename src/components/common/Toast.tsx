// Stub — full implementation in later phases
export function Toast({ message, type }: { message: string; type?: 'info' | 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-gray-800'
    } text-white`}>
      {message}
    </div>
  )
}

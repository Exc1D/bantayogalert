import { useEffect, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster, toast } from 'sonner'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AppCheckProvider } from '@/lib/app-check'
import { useFcmToken } from '@/hooks/useFcmToken'
import { useMunicipalityTopics } from '@/hooks/useMunicipalityTopics'
import {
  onMessageInApp,
  setSwConfig,
} from '@/lib/firebase/messaging'
import { ANNOUNCEMENTS_QUERY_KEY } from '@/hooks/useAnnouncements'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export interface AppProvidersProps {
  children: ReactNode
}

function FCMSetup() {
  const { user, customClaims } = useAuth()
  const queryClient = useQueryClient()

  useFcmToken({
    userId: user?.uid ?? '',
    municipalityCode: customClaims?.municipalityCode ?? null,
    enabled: Boolean(user),
  })

  useMunicipalityTopics({
    municipalityCode: customClaims?.municipalityCode ?? null,
    enabled: Boolean(user),
  })

  useEffect(() => {
    void setSwConfig()
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    let unsubscribed = false
    let unsubscribe = () => {}

    void onMessageInApp((payload) => {
      const title = payload.notification?.title ?? 'Bantayog Alert'
      const description = payload.notification?.body ?? ''

      toast(title, {
        description,
        duration: 8000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/app/alerts'
          },
        },
      })

      void queryClient.invalidateQueries({
        queryKey: ANNOUNCEMENTS_QUERY_KEY,
      })
    }).then((cleanup) => {
      if (unsubscribed) {
        cleanup()
        return
      }

      unsubscribe = cleanup
    })

    return () => {
      unsubscribed = true
      unsubscribe()
    }
  }, [queryClient, user])

  return null
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppCheckProvider>
            <FCMSetup />
            <Toaster position="top-center" richColors closeButton />
            {children}
          </AppCheckProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

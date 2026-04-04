import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { httpsCallable, getFunctions } from 'firebase/functions'
import type { Contact } from '@/types/contact'

interface UseContactsOptions {
  includeInactive?: boolean
}

export function useContacts(options: UseContactsOptions = {}) {
  const { includeInactive = false } = options
  const queryClient = useQueryClient()

  // Fetch contacts via callable CF
  const contactsQuery = useQuery({
    queryKey: ['contacts', { includeInactive }],
    queryFn: async (): Promise<Contact[]> => {
      const fn = getFunctions()
      const callable = httpsCallable<{ municipalityCode?: string; includeInactive?: boolean }, { contacts: Contact[] }>(
        fn,
        'getContacts'
      )
      const result = await callable({ includeInactive })
      return result.data.contacts
    },
  })

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => {
      const fn = getFunctions()
      const callable = httpsCallable(fn, 'createContact')
      return callable(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Contact> & { id: string }) => {
      const fn = getFunctions()
      const callable = httpsCallable(fn, 'updateContact')
      return callable({ id, ...data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  // Deactivate/reactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async ({ id, deactivate }: { id: string; deactivate: boolean }) => {
      const fn = getFunctions()
      const callable = httpsCallable(fn, 'deactivateContact')
      return callable({ id, deactivate })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createContact: createMutation.mutateAsync,
    updateContact: updateMutation.mutateAsync,
    deactivateContact: deactivateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
  }
}

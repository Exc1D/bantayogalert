import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { ContactSchema, type Contact } from '@/types/contact'
import { ContactType } from '@/types/contact'

type ContactFormData = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>

interface ContactFormProps {
  contact?: Contact  // If provided, form is in edit mode
  onSubmit: (data: ContactFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ContactForm({ contact, onSubmit, onCancel, isLoading }: ContactFormProps) {
  const isEdit = !!contact

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          agency: contact.agency,
          type: contact.type,
          phones: contact.phones,
          email: contact.email ?? '',
          capabilities: contact.capabilities,
          municipalityCode: contact.municipalityCode,
          barangayCode: contact.barangayCode,
          isActive: contact.isActive,
        }
      : {
          phones: [''],
          capabilities: [],
          isActive: true,
        },
  })

  const [newCapability, setNewCapability] = useState('')
  const capabilities = watch('capabilities') ?? []

  const addCapability = () => {
    if (newCapability.trim()) {
      setValue('capabilities', [...capabilities, newCapability.trim()])
      setNewCapability('')
    }
  }

  const removeCapability = (index: number) => {
    setValue(
      'capabilities',
      capabilities.filter((_, i) => i !== index)
    )
  }

  const [newPhone, setNewPhone] = useState('')
  const phones = watch('phones') ?? []

  const addPhone = () => {
    if (newPhone.trim()) {
      setValue('phones', [...phones, newPhone.trim()])
      setNewPhone('')
    }
  }

  const removePhone = (index: number) => {
    setValue(
      'phones',
      phones.filter((_, i) => i !== index)
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          {...register('name')}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Responder or unit name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Agency</label>
        <input
          {...register('agency')}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Agency or organization"
        />
        {errors.agency && <p className="mt-1 text-sm text-red-600">{errors.agency.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          {...register('type')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
        >
          {Object.values(ContactType).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Municipality Code</label>
        <input
          {...register('municipalityCode')}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., bas, labo"
          maxLength={4}
        />
        {errors.municipalityCode && (
          <p className="mt-1 text-sm text-red-600">{errors.municipalityCode.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phones</label>
        <div className="space-y-2">
          {phones.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={phone}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50"
              />
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-red-600"
                onClick={() => removePhone(index)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="+63 9XX XXX XXXX"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhone())}
            />
            <button
              type="button"
              className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded"
              onClick={addPhone}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {errors.phones && <p className="mt-1 text-sm text-red-600">{errors.phones.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
        <input
          type="email"
          {...register('email')}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="contact@agency.gov.ph"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Capabilities</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {capabilities.map((cap, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
              >
                {cap}
                <button
                  type="button"
                  onClick={() => removeCapability(index)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCapability}
              onChange={(e) => setNewCapability(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Search and Rescue, Medical Transport"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
            />
            <button
              type="button"
              className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded"
              onClick={addCapability}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {errors.capabilities && (
          <p className="mt-1 text-sm text-red-600">{errors.capabilities.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded disabled:opacity-50"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Contact' : 'Create Contact'}
        </button>
      </div>
    </form>
  )
}

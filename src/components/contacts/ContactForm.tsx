import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { ContactSchema, type Contact } from '@/types/contact'
import { ContactType } from '@/types/contact'
import { z } from 'zod'

// Use z.input for form data since handleSubmit passes form values
type ContactFormData = z.input<typeof ContactSchema>

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
    resolver: zodResolver(ContactSchema) as any,
    defaultValues: contact
      ? {
          name: contact.name,
          agency: contact.agency,
          type: contact.type,
          phones: contact.phones,
          email: contact.email,
          capabilities: contact.capabilities,
          municipalityCode: contact.municipalityCode,
          barangayCode: contact.barangayCode,
          isActive: contact.isActive,
        }
      : {
          name: '',
          agency: '',
          type: ContactType.Other,
          phones: [''] as string[],
          email: undefined,
          capabilities: [] as string[],
          municipalityCode: '',
          isActive: true,
        },
  })

  const [newCapability, setNewCapability] = useState('')
  const capabilities = watch('capabilities') ?? []

  const addCapability = () => {
    if (newCapability.trim()) {
      setValue('capabilities', [...capabilities, newCapability.trim()] as any)
      setNewCapability('')
    }
  }

  const removeCapability = (index: number) => {
    setValue(
      'capabilities',
      capabilities.filter((_: string, i: number) => i !== index) as any
    )
  }

  const [newPhone, setNewPhone] = useState('')
  const phones = watch('phones') ?? []

  const addPhone = () => {
    if (newPhone.trim()) {
      setValue('phones', [...phones, newPhone.trim()] as any)
      setNewPhone('')
    }
  }

  const removePhone = (index: number) => {
    setValue(
      'phones',
      phones.filter((_: string, i: number) => i !== index) as any
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          {...register('name')}
          id="contact-name"
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-brand ring-offset-2"
          placeholder="Responder or unit name"
        />
        {errors.name && <p id="contact-name-error" className="mt-1 text-sm text-red-600">{String(errors.name?.message ?? '')}</p>}
      </div>

      <div>
        <label htmlFor="contact-agency" className="block text-sm font-medium text-gray-700">Agency</label>
        <input
          {...register('agency')}
          id="contact-agency"
          aria-describedby={errors.agency ? 'contact-agency-error' : undefined}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-brand ring-offset-2"
          placeholder="Agency or organization"
        />
        {errors.agency && <p id="contact-agency-error" className="mt-1 text-sm text-red-600">{String(errors.agency?.message ?? '')}</p>}
      </div>

      <div>
        <label htmlFor="contact-type" className="block text-sm font-medium text-gray-700">Type</label>
        <select
          {...register('type')}
          id="contact-type"
          aria-describedby={errors.type ? 'contact-type-error' : undefined}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-brand ring-offset-2 text-base px-3 py-2 border"
        >
          {Object.values(ContactType).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
        {errors.type && <p id="contact-type-error" className="mt-1 text-sm text-red-600">{String(errors.type?.message ?? '')}</p>}
      </div>

      <div>
        <label htmlFor="contact-municipalityCode" className="block text-sm font-medium text-gray-700">Municipality Code</label>
        <input
          {...register('municipalityCode')}
          id="contact-municipalityCode"
          aria-describedby={errors.municipalityCode ? 'contact-municipalityCode-error' : undefined}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-brand ring-offset-2"
          placeholder="e.g., bas, labo"
          maxLength={4}
        />
        {errors.municipalityCode && (
          <p id="contact-municipalityCode-error" className="mt-1 text-sm text-red-600">{String(errors.municipalityCode?.message ?? '')}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phones</label>
        <div className="space-y-2">
          {phones.map((phone: string, index: number) => (
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
              id="contact-new-phone"
              aria-label="New phone number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-brand ring-offset-2"
              placeholder="+63 9XX XXX XXXX"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhone())}
            />
            <button
              type="button"
              className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded"
              onClick={addPhone}
              aria-label="Add phone"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {errors.phones && <p className="mt-1 text-sm text-red-600">{String(errors.phones?.message ?? '')}</p>}
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Email (optional)</label>
        <input
          type="email"
          {...register('email')}
          id="contact-email"
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-brand ring-offset-2"
          placeholder="contact@agency.gov.ph"
        />
        {errors.email && <p id="contact-email-error" className="mt-1 text-sm text-red-600">{String(errors.email?.message ?? '')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Capabilities</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {capabilities.map((cap: string, index: number) => (
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
              id="contact-new-capability"
              aria-label="New capability"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-brand ring-offset-2"
              placeholder="e.g., Search and Rescue, Medical Transport"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
            />
            <button
              type="button"
              className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded"
              onClick={addCapability}
              aria-label="Add capability"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {errors.capabilities && (
          <p className="mt-1 text-sm text-red-600">{String(errors.capabilities?.message ?? '')}</p>
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

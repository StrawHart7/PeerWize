'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { useToast } from '@/src/components/ToastProvider'

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [actif, setActif] = useState(true)
  const [copied, setCopied] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [form, setForm] = useState({
    nom: '',
    description: '',
    prix_fcfa: '',
    slug: '',
  })

  function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 6)
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'nom' ? { slug: `${slugify(value)}-${randomSuffix()}` } : {}),
    }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPhotos: { file: File; preview: string }[] = []
    let hasError = false

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) {
        setError(`La photo "${file.name}" dépasse 5MB.`)
        hasError = true
        continue
      }
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
      })
    }

    if (!hasError && newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos])
      // Reset l'input pour permettre de re-sélectionner les mêmes fichiers
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    if (currentPhotoIndex >= index && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1)
    }
  }

  function handleCopy() {
    if (!form.slug) return
    const url = `${window.location.origin}/p/${form.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit() {
    setError(null)

    if (!form.nom.trim() || !form.prix_fcfa || !form.slug) {
      setError('Nom et prix sont obligatoires.')
      return
    }

    if (photos.length === 0) {
      setError('Ajoutez au moins une photo.')
      return
    }

    const currentSlug = form.slug
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Non connecté.')
      setLoading(false)
      return
    }

    // Vérifier unicité du slug
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', currentSlug)
      .single()

    if (existing) {
      const newSlug = `${slugify(form.nom)}-${randomSuffix()}`
      setForm(prev => ({ ...prev, slug: newSlug }))
      setError('Conflit de lien détecté, réessayez.')
      setLoading(false)
      return
    }

    // Upload de toutes les photos
    const photoUrls: string[] = []
    let uploadError = false

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const ext = photo.file.name.split('.').pop()
      const path = `${user.id}/${currentSlug}-${Date.now()}-${i}.${ext}`

      const { error } = await supabase.storage
        .from('products')
        .upload(path, photo.file)

      if (error) {
        setError(`Erreur upload photo ${i + 1}: ${error.message}`)
        uploadError = true
        break
      }

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(path)

      photoUrls.push(urlData.publicUrl)
    }

    if (uploadError) {
      setLoading(false)
      return
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!seller) {
      setError('Vendeur introuvable.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('products').insert({
      seller_id: seller.id,
      nom: form.nom,
      description: form.description,
      prix_fcfa: parseInt(form.prix_fcfa),
      slug: currentSlug,
      photo_url: photoUrls[0] || null,
      photos: photoUrls, // Nouveau champ pour stocker toutes les photos
      actif,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    toast("success", "Produit publié avec succès !")
    router.push(`/dashboard/products/${currentSlug}/share`)
  }

  const previewLink = form.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${form.slug}`
    : '/p/votre-produit'

  // Navigation du carousel
  const goToPrev = () => {
    setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const goToNext = () => {
    setCurrentPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A1C1E' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="p-1.5 rounded" style={{ backgroundColor: '#2a2d30' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="9" y="1" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="1" y="9" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#FFCD00"/>
          </svg>
        </div>
        <span className="text-sm" style={{ color: '#9ca3af' }}>Créer un Produit</span>
      </div>

      {/* Card principale */}
      <div className="rounded-t-2xl min-h-screen pb-28 px-4 pt-5 bg-white">

        {/* Titre + navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 rounded-full hover:bg-gray-100 transition"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1A1C1E" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="text-lg font-bold"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
            >
              Ajouter un produit
            </h1>
          </div>
          <button className="p-1 rounded-full hover:bg-gray-100 transition">
            <svg width="20" height="20" fill="#6b7280" viewBox="0 0 24 24">
              <path d="M12 13a1 1 0 100-2 1 1 0 000 2zm-4 0a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/>
            </svg>
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm border"
            style={{ backgroundColor: '#fef2f2', color: '#D21034', borderColor: '#fecaca' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-6">

          {/* Upload photo - Multi avec carousel */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#006A4E' }}>
              Photos du produit
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              multiple
              className="hidden"
            />
            <div
              className="relative w-full rounded-xl overflow-hidden cursor-pointer"
              style={{ height: '13rem', backgroundColor: '#f9fafb', border: photos.length > 0 ? 'none' : '2px dashed #d1d5db' }}
            >
              {photos.length > 0 ? (
                <>
                  {/* Image principale */}
                  <div className="w-full h-full relative">
                    <img
                      src={photos[currentPhotoIndex].preview}
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-contain"
                      style={{ zIndex: 1, position: 'relative' }}
                    />

                    {/* Indicateur de nombre de photos */}
                    <div
                      className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs text-white"
                      style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 2 }}
                    >
                      {currentPhotoIndex + 1}/{photos.length}
                    </div>

                    {/* Boutons navigation */}
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); goToPrev() }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); goToNext() }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Dots indicateurs */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 2 }}>
                          {photos.map((_, index) => (
                            <button
                              key={index}
                              onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(index) }}
                              className="w-2 h-2 rounded-full transition-all"
                              style={{
                                backgroundColor: index === currentPhotoIndex ? '#006A4E' : 'rgba(255,255,255,0.5)',
                                width: index === currentPhotoIndex ? '8px' : '6px',
                                height: index === currentPhotoIndex ? '8px' : '6px',
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Bouton changer */}
                    <div
                      className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs text-white cursor-pointer"
                      style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 2 }}
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    >
                      Ajouter +
                    </div>

                    {/* Bouton supprimer la photo courante */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removePhoto(currentPhotoIndex) }}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: 'rgba(210,16,52,0.8)', zIndex: 2 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#006A4E" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: '#006A4E' }}>
                    Appuyez pour ajouter des photos
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG, WEBP (Max 5MB chacun)</span>
                  <span className="text-xs text-gray-400">Sélectionnez plusieurs photos</span>
                </div>
              )}
            </div>
            {photos.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 font-vietnam">
                {photos.length} photo{photos.length > 1 ? 's' : ''} sélectionnée{photos.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#006A4E' }}>
              Nom du produit
            </label>
            <input
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Ex: Smartphone X2"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ color: '#1A1C1E' }}
            />
          </div>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#006A4E' }}>
              Prix en FCFA
            </label>
            <div className="relative">
              <input
                name="prix_fcfa"
                type="number"
                value={form.prix_fcfa}
                onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-16 text-sm focus:outline-none"
                style={{ color: '#1A1C1E' }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                FCFA
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#006A4E' }}>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Décrivez les caractéristiques et l'état de votre produit..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              style={{ color: '#1A1C1E' }}
            />
          </div>

          {/* Toggle actif */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1A1C1E' }}>Produit actif</p>
              <p className="text-xs text-gray-500 mt-0.5">Visible par vos clients immédiatement</p>
            </div>
            <button
              onClick={() => setActif(!actif)}
              className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
              style={{ backgroundColor: actif ? '#006A4E' : '#d1d5db' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                style={{ left: actif ? '26px' : '2px' }}
              />
            </button>
          </div>

          {/* Aperçu lien */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#006A4E' }}>
              Lien du produit
            </label>
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3 gap-3"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#006A4E" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span
                  className="text-xs truncate"
                  style={{ color: '#6b7280', fontFamily: 'var(--font-vietnam)' }}
                >
                  {previewLink}
                </span>
              </div>
              <button
                onClick={handleCopy}
                disabled={!form.slug}
                className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200"
                style={{
                  backgroundColor: copied ? '#006A4E' : '#fff',
                  color: copied ? '#fff' : '#1A1C1E',
                  border: copied ? '1px solid #006A4E' : '1px solid #e5e7eb',
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                {copied ? '✓ Copié !' : 'Copier'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bouton fixe bas */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white text-sm font-semibold transition"
          style={{ backgroundColor: loading ? '#4a9a7e' : '#006A4E', fontFamily: 'var(--font-jakarta)' }}
        >
          {loading ? (
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
            />
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Publier le produit
            </>
          )}
        </button>
      </div>

    </div>
  )
}
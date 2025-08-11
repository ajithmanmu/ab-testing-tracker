'use client'

import { useState, useEffect } from 'react'
import VariantA from '../components/VariantA'
import VariantB from '../components/VariantB'

interface Variant {
  id: string
  weight: number
}

interface Experiment {
  id: string
  active: boolean
  variants: Variant[]
}

interface Manifest {
  experiments: Experiment[]
}

export default function Home() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
console.log({manifest})
  useEffect(() => {
    fetchManifest()
  }, [])

  const fetchManifest = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual CloudFront URL when provided
      // For now, using dummy manifest data as specified in the spec
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const dummyManifest: Manifest = {
        experiments: [
          {
            id: "cta-color-001",
            active: true,
            variants: [
              { id: "A", weight: 50 },
              { id: "B", weight: 50 }
            ]
          }
        ]
      }
      
      setManifest(dummyManifest)
      selectVariants(dummyManifest)
    } catch (err) {
      setError('Failed to fetch manifest from S3')
      console.error('Error fetching manifest:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectVariants = (manifestData: Manifest) => {
    const variants: Record<string, string> = {}
    
    manifestData.experiments.forEach(experiment => {
      if (experiment.active) {
        const selectedVariant = selectVariantByWeight(experiment.variants)
        variants[experiment.id] = selectedVariant
      }
    })
    
    setSelectedVariants(variants)
  }

  const selectVariantByWeight = (variants: Variant[]): string => {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0)
    const random = Math.random() * totalWeight
    
    let currentWeight = 0
    for (const variant of variants) {
      currentWeight += variant.weight
      if (random <= currentWeight) {
        return variant.id
      }
    }
    
    return variants[0].id // fallback
  }

  const renderExperiment = (experimentId: string, variantId: string) => {
    switch (variantId) {
      case 'A':
        return <VariantA />
      case 'B':
        return <VariantB />
      default:
        return <VariantA />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-600">
        Loading AB Testing Experiment...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <div className="text-red-600 text-lg">{error}</div>
        <button 
          onClick={fetchManifest}
          className="px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-5 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-5 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AB Testing Experiment
          </h1>
          <p className="text-gray-600 text-base">
            Testing different UI variants based on manifest configuration
          </p>
        </div>
        
        {manifest && manifest.experiments.map(experiment => (
          <div key={experiment.id} className="mb-6">
            <div className="mb-3 p-2 bg-gray-200 rounded text-sm text-gray-700">
              Experiment: {experiment.id} | 
              Variant: {selectedVariants[experiment.id]} | 
              Weight: {manifest.experiments.find(e => e.id === experiment.id)?.variants.find(v => v.id === selectedVariants[experiment.id])?.weight}%
            </div>
            {renderExperiment(experiment.id, selectedVariants[experiment.id])}
          </div>
        ))}
        
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-300">
          <h3 className="text-gray-800 font-semibold mb-3">Manifest Configuration</h3>
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  )
} 
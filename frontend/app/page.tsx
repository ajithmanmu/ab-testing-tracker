'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { v4 as uuidv4 } from 'uuid'
import VariantA from '../components/VariantA'
import VariantB from '../components/VariantB'
import StatsPanel, { type StatsResponse } from '../components/StatsPanel' // STATS: import

interface Variant { id: string; weight: number }
interface Experiment { id: string; active: boolean; variants: Variant[] }
interface Manifest { experiments: Experiment[] }

const COLLECT_URL = process.env.NEXT_PUBLIC_COLLECT_URL || ''

export default function Home() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [impresssionLogged, setImpresssionLogged] = useState(false)
  const [clickLoading, setClickLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [statsByExp, setStatsByExp] = useState<Record<string, StatsResponse | null>>({})
  const [statsLoading, setStatsLoading] = useState<Record<string, boolean>>({})
  const [statsError, setStatsError] = useState<Record<string, string | null>>({})

  // Stable userId via cookie
  useEffect(() => {
    let uid = Cookies.get('ab_user_id')
    if (!uid) {
      uid = uuidv4()
      Cookies.set('ab_user_id', uid, { expires: 365, sameSite: 'lax', path: '/' })
    }
    setUserId(uid)
  }, [])

  useEffect(() => {
    fetchManifest()
  }, [])

  const fetchManifest = async () => {
    try {
      setLoading(true)
      const url =
        process.env.NEXT_PUBLIC_MANIFEST_URL ||
        'https://d279rjimimdjtb.cloudfront.net/a-b-testing-tracker/manifest_08112025.json'
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Failed to fetch manifest: ${response.status}`)
      const manifestData: Manifest = await response.json()
      setManifest(manifestData)
      selectVariants(manifestData)
    } catch (err) {
      setError('Failed to fetch manifest from CloudFront')
      console.error('Error fetching manifest:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectVariants = (manifestData: Manifest) => {
    const variants: Record<string, string> = {}
    manifestData.experiments.forEach(exp => {
      if (exp.active) {
        variants[exp.id] = selectVariantByWeight(exp.variants)
      }
    })
    setSelectedVariants(variants)
  }

  const selectVariantByWeight = (variants: Variant[]): string => {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0)
    const r = Math.random() * totalWeight
    let acc = 0
    for (const v of variants) {
      acc += v.weight
      if (r <= acc) return v.id
    }
    return variants[0].id
  }

  // Log impressions AFTER variants are chosen (runs every page load)
  useEffect(() => {
    if (!userId) return
    const entries = Object.entries(selectedVariants)
    if (!entries.length) return
    if (impresssionLogged) return

    ;(async () => {
      for (const [experimentId, variantId] of entries) {
        try {
          await fetch(COLLECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'log_impression',
              experimentId,
              userId,
              variant: variantId
            })
          })
        } catch (e) {
          console.error('log_impression error', { experimentId, e })
        }
      }
    })()

    setImpresssionLogged(true)
  }, [selectedVariants, userId, impresssionLogged])

  const handleClick = async (experimentId: string, variantId: string) => {
    setClickLoading(prev => ({ ...prev, [experimentId]: true }))
    try {
      await fetch(COLLECT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_click',
          experimentId,
          userId,
          variant: variantId
        })
      })
    } catch (err) {
      console.error('log_click error', err)
    } finally {
      setTimeout(() => {
        setClickLoading(prev => ({ ...prev, [experimentId]: false }))
      }, 1000)
    }
  }

  // STATS: fetch per experiment
  const handleGetStats = async (experimentId: string) => {
    setStatsError(prev => ({ ...prev, [experimentId]: null }))
    setStatsLoading(prev => ({ ...prev, [experimentId]: true }))
    try {
      const res = await fetch(COLLECT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_stats',
          experimentId
        })
      })
      const json = (await res.json()) as StatsResponse | { error?: string; message?: string }
      if (!res.ok || (json as any).error) {
        throw new Error((json as any).error || (json as any).message || `HTTP ${res.status}`)
      }
      setStatsByExp(prev => ({ ...prev, [experimentId]: json as StatsResponse }))
    } catch (e: any) {
      setStatsError(prev => ({ ...prev, [experimentId]: e?.message ?? 'Failed to fetch stats' }))
    } finally {
      setStatsLoading(prev => ({ ...prev, [experimentId]: false }))
    }
  }

  const renderExperiment = (experimentId: string, variantId: string) => {
    const isLoading = clickLoading[experimentId] || false
    switch (variantId) {
      case 'A':
        return <VariantA loading={isLoading} onClick={() => handleClick(experimentId, variantId)} />
      case 'B':
        return <VariantB loading={isLoading} onClick={() => handleClick(experimentId, variantId)} />
      default:
        return <VariantA loading={isLoading} onClick={() => handleClick(experimentId, variantId)} />
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
            A/B Testing Experiment
          </h1>
          <p className="text-gray-600 text-base">
            Testing different UI variants based on manifest configuration
          </p>
        </div>

        {manifest && manifest.experiments.map(experiment => {
          const variantId = selectedVariants[experiment.id]
          const stats = statsByExp[experiment.id]
          const statsBusy = !!statsLoading[experiment.id]
          const statsErr = statsError[experiment.id] || null

          return (
            <div key={experiment.id} className="mb-6">
              <div className="mb-3 p-2 bg-gray-200 rounded text-sm text-gray-700">
                Experiment: {experiment.id} |{' '}
                Variant: {variantId} |{' '}
                Weight: {
                  manifest.experiments
                    .find(e => e.id === experiment.id)
                    ?.variants.find(v => v.id === variantId)?.weight
                }%
              </div>

              {variantId && renderExperiment(experiment.id, variantId)}

              {/* STATS: button + panel */}
              <div className="mt-3">
                <button
                  onClick={() => handleGetStats(experiment.id)}
                  disabled={statsBusy}
                  className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {statsBusy ? 'Fetching…' : 'Get stats'}
                </button>
                {statsErr && (
                  <div className="mt-2 text-sm text-red-600">
                    {statsErr}
                  </div>
                )}
                {stats && <StatsPanel data={stats} />}
              </div>
            </div>
          )
        })}

        {manifest && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-blue-900 font-semibold mb-3">Manifest Configuration</h3>
            <pre className="bg-white p-3 rounded text-xs overflow-auto text-gray-800 border border-gray-200">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}

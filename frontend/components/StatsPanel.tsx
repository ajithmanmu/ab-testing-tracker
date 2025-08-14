'use client'

type VariantStats = {
  impressions: number
  clicks: number
  ctr: number
  uniqueUsers: number
}

export type StatsResponse = {
  experimentId: string
  window: { from: string; to: string }
  totals: VariantStats
  variants: Record<string, VariantStats>
}

export default function StatsPanel({ data }: { data: StatsResponse }) {
  const { experimentId, window, totals, variants } = data
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <div className="text-sm text-gray-500">
          Stats for <span className="font-mono">{experimentId}</span>
        </div>
        <div className="text-xs text-gray-400">
          Window: {new Date(window.from).toLocaleString()} — {new Date(window.to).toLocaleString()}
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-semibold text-gray-800 mb-1">Totals</h4>
        <div className="text-sm text-gray-700">
          Impressions: <b>{totals.impressions}</b> · Clicks: <b>{totals.clicks}</b> · CTR:{' '}
          <b>{(totals.ctr * 100).toFixed(2)}%</b> · Unique Users: <b>{totals.uniqueUsers}</b>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Per Variant</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Variant</th>
                <th className="py-2 pr-4">Impressions</th>
                <th className="py-2 pr-4">Clicks</th>
                <th className="py-2 pr-4">CTR</th>
                <th className="py-2 pr-4">Unique Users</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(variants).map(([variant, s]) => (
                <tr key={variant} className="border-t border-gray-100 text-gray-500">
                  <td className="py-2 pr-4 font-mono">{variant}</td>
                  <td className="py-2 pr-4">{s.impressions}</td>
                  <td className="py-2 pr-4">{s.clicks}</td>
                  <td className="py-2 pr-4">{(s.ctr * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-4">{s.uniqueUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

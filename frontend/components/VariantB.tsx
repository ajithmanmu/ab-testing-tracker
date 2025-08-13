'use client'

interface VariantBProps {
  loading?: boolean
  onClick?: () => void
}

export default function VariantB({ loading = false, onClick }: VariantBProps) {
  return (
    <div className="p-5 bg-gradient-to-br from-pink-400 to-red-500 rounded-xl text-white text-center shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Variant B</h2>
      <p className="mb-5 opacity-90">
        This is the test version with pink gradient background
      </p>
      <button
        onClick={onClick}
        disabled={loading}
        className="bg-white/20 border-2 border-white/30 text-white px-6 py-3 rounded-lg text-base cursor-pointer transition-all duration-300 hover:bg-white/30 hover:border-white/50 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Start Now'}
      </button>
    </div>
  )
}

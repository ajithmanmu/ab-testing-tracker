export default function VariantA() {
  return (
    <div className="p-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white text-center shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Variant A</h2>
      <p className="mb-5 opacity-90">This is the control version with blue gradient background</p>
      <button className="bg-white/20 border-2 border-white/30 text-white px-6 py-3 rounded-lg text-base cursor-pointer transition-all duration-300 hover:bg-white/30 hover:border-white/50">
        Get Started
      </button>
    </div>
  )
} 
import { motion } from "framer-motion";


export function MetricCard({
    title,
    value,
    icon: Icon,
    color = "cyan",
    detail,
  }: {
    title: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    color?: "cyan" | "purple" | "blue" | "green"
    detail: string
  }) {
    const colorClasses = {
      cyan: "from-cyan-500 to-blue-500 border-cyan-500/30 text-cyan-500",
      purple: "from-purple-500 to-pink-500 border-purple-500/30 text-purple-500",
      blue: "from-blue-500 to-indigo-500 border-blue-500/30 text-blue-500",
      green: "from-green-500 to-emerald-500 border-green-500/30 text-green-500"
    }
  
    return (

        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
      >
      <div className={`rounded-lg border ${colorClasses[color].split(' ')[2]} p-4 relative overflow-hidden
        bg-white dark:bg-slate-800/50`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600 dark:text-slate-400">{title}</div>
          <Icon className={`h-5 w-5 ${colorClasses[color].split(' ')[3]}`} />
        </div>
        <div className="text-2xl font-bold mb-1 text-gray-800 dark:text-slate-200">
          {value}
        </div>
        <div className="text-xs text-gray-500 dark:text-slate-500">{detail}</div>
        <div className={`absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl 
          ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]}`} />
      </div>
      </motion.div>

    )
  }
  
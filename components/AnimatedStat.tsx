import { motion, useMotionTemplate } from "framer-motion"

function AnimatedStat({
  label,
  value,
  hint,
}: {
  label: string
  value: any
  hint?: string
}) {
  // create a live reactive string for rendering
  const formatted = useMotionTemplate`$${value}`

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-muted/20 p-5 hover:bg-muted/30 transition-colors"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <motion.p
        className="mt-1 text-xl font-semibold tracking-tight"
        style={{ opacity: 1 }}
      >
        {formatted}
      </motion.p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </motion.div>
  )
}

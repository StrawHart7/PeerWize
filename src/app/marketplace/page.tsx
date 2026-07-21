"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function MarketplacePage() {
  const router = useRouter();

  // Correction des Variants avec le bon typage
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-screen w-screen overflow-hidden flex flex-col bg-white"
    >
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center px-4 pt-12 pb-4 shrink-0"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={22} color="#1A1C1E" />
        </motion.button>
      </motion.header>

      {/* Corps centré */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-center justify-center px-6 text-center"
      >
        <motion.div
          variants={iconVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "#FFCD00" }}
          >
            <ShoppingBag size={36} color="#1A1C1E" />
          </motion.div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-2xl font-bold text-[#1A1C1E] font-[var(--font-jakarta)] mb-3"
        >
          La marketplace arrive bientôt
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-sm text-gray-500 font-[var(--font-vietnam)] leading-relaxed max-w-xs"
        >
          Découvrez les boutiques des vendeurs togolais directement depuis
          l&apos;application. Fonctionnalité disponible en V1.0.
        </motion.p>

        {/* Points animés */}
        <motion.div
          variants={itemVariants}
          className="flex gap-2 mt-6"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                y: [0, -8, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.3,
                ease: "easeInOut",
              }}
              className="w-2 h-2 rounded-full bg-[#006A4E]"
            />
          ))}
        </motion.div>
      </motion.main>

      {/* Footer */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.4 }}
        className="px-6 pb-12 shrink-0"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.back()}
          className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-colors relative overflow-hidden"
          style={{ backgroundColor: "#006A4E" }}
        >
          {/* Effet de vague au survol */}
          <motion.span
            className="absolute inset-0 bg-white opacity-0"
            whileHover={{ opacity: 0.1 }}
            transition={{ duration: 0.3 }}
          />
          
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            Retour à l&apos;accueil
          </motion.span>
        </motion.button>
      </motion.footer>
    </motion.div>
  );
}
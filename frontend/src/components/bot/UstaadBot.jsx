import { motion, AnimatePresence } from 'framer-motion'

const EXPRESSIONS = {
  welcoming: {
    eyes: 'happy', mouth: 'big-smile', color: '#1D9E75', animation: 'bob', label: '🤗'
  },
  excited: {
    eyes: 'star', mouth: 'open-smile', color: '#534AB7', animation: 'pulse', label: '🤩'
  },
  thinking: {
    eyes: 'thinking', mouth: 'neutral', color: '#888780', animation: 'none', label: '🤔'
  },
  encouraging: {
    eyes: 'determined', mouth: 'smile', color: '#BA7517', animation: 'none', label: '💪'
  },
  strict: {
    eyes: 'stern', mouth: 'straight', color: '#993C1D', animation: 'shake', label: '😤'
  },
  celebrating: {
    eyes: 'closed-happy', mouth: 'big-smile', color: '#0F6E56', animation: 'bob', label: '🎉'
  },
  typing: {
    eyes: 'normal', mouth: 'slight-smile', color: '#1D9E75', animation: 'none', label: '⌨️'
  },
  cool: {
    eyes: 'glasses', mouth: 'slight-smile', color: '#1D9E75', animation: 'bob', label: '😎'
  },
}

const animations = {
  bob: { y: [0, -8, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } },
  pulse: { scale: [1, 1.06, 1], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  shake: { rotate: [0, -3, 3, -3, 3, 0], transition: { duration: 0.6, repeat: Infinity } },
  none: {}
}

function MaleBot({ expr, expression, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <path d="M14,120 Q14,100 50,95 Q86,100 86,120 L88,130 L12,130 Z" fill={expr.color} />
      {/* Shirt */}
      <path d="M40,95 L50,108 L60,95" fill="#E8DCC8" />
      {/* Neck */}
      <rect x="43" y="82" width="14" height="16" rx="4" fill="#D4956A" />
      {/* Head */}
      <ellipse cx="50" cy="66" rx="28" ry="28" fill="#D4956A" />
      {/* Hair */}
      <path d="M22,50 Q28,34 50,32 Q72,34 78,50 Q70,42 62,44 Q50,40 38,44 Q28,42 22,50Z" fill="#3D2B1F" />
      <path d="M22,50 Q18,60 20,70" fill="none" stroke="#3D2B1F" strokeWidth="4" strokeLinecap="round" />
      <path d="M78,50 Q82,60 80,70" fill="none" stroke="#3D2B1F" strokeWidth="4" strokeLinecap="round" />
      <path d="M30,38 Q40,34 50,33" fill="none" stroke="#5C3317" strokeWidth="1" opacity="0.4" />
      <path d="M50,33 Q60,34 70,38" fill="none" stroke="#5C3317" strokeWidth="1" opacity="0.4" />
      {/* Eyes */}
      <BotEyes expr={expr} />
      {/* Mouth */}
      <BotMouth expr={expr} />
      {/* Cheeks */}
      {['welcoming', 'excited', 'celebrating'].includes(expression) && <>
        <ellipse cx="28" cy="72" rx="6" ry="4" fill="#C0795A" opacity="0.35" />
        <ellipse cx="72" cy="72" rx="6" ry="4" fill="#C0795A" opacity="0.35" />
      </>}
      {/* Celebrating confetti */}
      {expression === 'celebrating' && <>
        <rect x="2" y="28" width="7" height="7" rx="1" fill="#FAC775" transform="rotate(30 5 31)" />
        <rect x="88" y="32" width="6" height="6" rx="1" fill="#E24B4A" transform="rotate(-20 91 35)" />
        <circle cx="8" cy="72" r="4" fill="#FAC775" />
        <circle cx="94" cy="68" r="4" fill="#E24B4A" />
      </>}
      {/* Thinking bubbles */}
      {expression === 'thinking' && <>
        <circle cx="85" cy="44" r="8" fill="none" stroke="#D1D5DB" strokeWidth="1" />
        <circle cx="96" cy="32" r="5" fill="none" stroke="#D1D5DB" strokeWidth="1" />
        <circle cx="103" cy="24" r="3" fill="none" stroke="#D1D5DB" strokeWidth="1" />
        <text x="85" y="48" textAnchor="middle" fontSize="8" fill="#9CA3AF">?</text>
      </>}
    </svg>
  )
}

function FemaleBot({ expr, expression, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body — pink top */}
      <path d="M14,120 Q14,100 50,95 Q86,100 86,120 L88,130 L12,130 Z" fill={expr.color} />
      {/* Dupatta / scarf hint */}
      <path d="M20,108 Q50,115 80,108" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
      {/* Shirt */}
      <path d="M40,95 L50,108 L60,95" fill="#F9D5E5" />
      {/* Neck */}
      <rect x="43" y="82" width="14" height="16" rx="4" fill="#D4956A" />
      {/* Head */}
      <ellipse cx="50" cy="66" rx="28" ry="28" fill="#D4956A" />
      {/* Hair — long */}
      <path d="M22,50 Q28,34 50,32 Q72,34 78,50 Q70,42 62,44 Q50,40 38,44 Q28,42 22,50Z" fill="#3D2B1F" />
      {/* Long hair sides */}
      <path d="M22,50 Q16,70 18,95" fill="none" stroke="#3D2B1F" strokeWidth="7" strokeLinecap="round" />
      <path d="M78,50 Q84,70 82,95" fill="none" stroke="#3D2B1F" strokeWidth="7" strokeLinecap="round" />
      {/* Hair texture */}
      <path d="M30,38 Q40,34 50,33" fill="none" stroke="#5C3317" strokeWidth="1" opacity="0.4" />
      <path d="M50,33 Q60,34 70,38" fill="none" stroke="#5C3317" strokeWidth="1" opacity="0.4" />
      {/* Eyes */}
      <BotEyes expr={expr} />
      {/* Eyelashes */}
      <path d="M32,59 L30,56" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36,57 L35,54" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40,58 L40,55" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M56,58 L55,55" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M60,57 L60,54" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M64,59 L65,56" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />
      {/* Mouth */}
      <BotMouth expr={expr} />
      {/* Cheeks */}
      {['welcoming', 'excited', 'celebrating'].includes(expression) && <>
        <ellipse cx="28" cy="72" rx="6" ry="4" fill="#E8A0B4" opacity="0.5" />
        <ellipse cx="72" cy="72" rx="6" ry="4" fill="#E8A0B4" opacity="0.5" />
      </>}
      {/* Celebrating confetti */}
      {expression === 'celebrating' && <>
        <rect x="2" y="28" width="7" height="7" rx="1" fill="#FAC775" transform="rotate(30 5 31)" />
        <rect x="88" y="32" width="6" height="6" rx="1" fill="#E24B4A" transform="rotate(-20 91 35)" />
        <circle cx="8" cy="72" r="4" fill="#FAC775" />
        <circle cx="94" cy="68" r="4" fill="#E24B4A" />
      </>}
      {/* Thinking bubbles */}
      {expression === 'thinking' && <>
        <circle cx="85" cy="44" r="8" fill="none" stroke="#D1D5DB" strokeWidth="1" />
        <circle cx="96" cy="32" r="5" fill="none" stroke="#D1D5DB" strokeWidth="1" />
        <circle cx="103" cy="24" r="3" fill="none" stroke="#D1D5DB" strokeWidth="1" />
        <text x="85" y="48" textAnchor="middle" fontSize="8" fill="#9CA3AF">?</text>
      </>}
    </svg>
  )
}

function BotEyes({ expr }) {
  return <>
    {expr.eyes === 'happy' && <>
      <path d="M34,62 Q38,57 42,62" fill="none" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58,62 Q62,57 66,62" fill="none" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" />
    </>}
    {expr.eyes === 'star' && <>
      <text x="36" y="68" textAnchor="middle" fontSize="13" fill="#3D2B1F">★</text>
      <text x="64" y="68" textAnchor="middle" fontSize="13" fill="#3D2B1F">★</text>
    </>}
    {expr.eyes === 'thinking' && <>
      <ellipse cx="38" cy="64" rx="5" ry="5" fill="#3D2B1F" />
      <ellipse cx="40" cy="62" rx="2" ry="2" fill="white" />
      <path d="M56,61 Q62,58 68,62" fill="none" stroke="#3D2B1F" strokeWidth="2" />
      <path d="M32,55 Q38,51 44,54" fill="none" stroke="#3D2B1F" strokeWidth="2" />
    </>}
    {expr.eyes === 'determined' && <>
      <ellipse cx="38" cy="64" rx="5" ry="5" fill="#3D2B1F" />
      <ellipse cx="40" cy="62" rx="2" ry="2" fill="white" />
      <ellipse cx="62" cy="64" rx="5" ry="5" fill="#3D2B1F" />
      <ellipse cx="64" cy="62" rx="2" ry="2" fill="white" />
      <path d="M32,55 Q38,52 44,55" fill="none" stroke="#3D2B1F" strokeWidth="2.5" />
      <path d="M56,55 Q62,52 68,55" fill="none" stroke="#3D2B1F" strokeWidth="2.5" />
    </>}
    {expr.eyes === 'stern' && <>
      <ellipse cx="38" cy="65" rx="5" ry="4" fill="#3D2B1F" />
      <ellipse cx="62" cy="65" rx="5" ry="4" fill="#3D2B1F" />
      <path d="M30,56 Q38,51 44,56" fill="none" stroke="#3D2B1F" strokeWidth="3" />
      <path d="M56,56 Q62,51 70,56" fill="none" stroke="#3D2B1F" strokeWidth="3" />
    </>}
    {expr.eyes === 'closed-happy' && <>
      <path d="M32,62 Q38,56 44,62" fill="none" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M56,62 Q62,56 68,62" fill="none" stroke="#3D2B1F" strokeWidth="2.5" strokeLinecap="round" />
    </>}
    {(expr.eyes === 'normal' || expr.eyes === undefined) && <>
      <ellipse cx="38" cy="64" rx="5" ry="5" fill="#3D2B1F" />
      <ellipse cx="40" cy="62" rx="2" ry="2" fill="white" />
      <ellipse cx="62" cy="64" rx="5" ry="5" fill="#3D2B1F" />
      <ellipse cx="64" cy="62" rx="2" ry="2" fill="white" />
    </>}
    {expr.eyes === 'glasses' && <>
      <rect x="29" y="59" width="18" height="11" rx="3" fill="#1A1A1A" opacity="0.85" />
      <rect x="53" y="59" width="18" height="11" rx="3" fill="#1A1A1A" opacity="0.85" />
      <rect x="28" y="58" width="20" height="13" rx="4" fill="none" stroke="#1A1A1A" strokeWidth="2.5" />
      <rect x="52" y="58" width="20" height="13" rx="4" fill="none" stroke="#1A1A1A" strokeWidth="2.5" />
      <path d="M48,64 L52,64" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
      <path d="M28,64 L22,62" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
      <path d="M72,64 L78,62" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
      <path d="M31,61 L34,61" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M55,61 L58,61" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </>}
  </>
}

function BotMouth({ expr }) {
  return <>
    {expr.mouth === 'big-smile' && <path d="M34,76 Q50,90 66,76" fill="none" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" />}
    {expr.mouth === 'open-smile' && <path d="M34,74 Q50,92 66,74" fill="#C0795A" stroke="#3D2B1F" strokeWidth="1.5" />}
    {expr.mouth === 'smile' && <path d="M36,74 Q50,84 64,74" fill="none" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" />}
    {expr.mouth === 'neutral' && <path d="M40,76 Q50,74 60,76" fill="none" stroke="#3D2B1F" strokeWidth="1.5" />}
    {expr.mouth === 'straight' && <path d="M38,76 Q50,74 62,76" fill="none" stroke="#3D2B1F" strokeWidth="2" />}
    {expr.mouth === 'slight-smile' && <path d="M38,76 Q50,80 62,76" fill="none" stroke="#3D2B1F" strokeWidth="1.5" strokeLinecap="round" />}
  </>
}

export default function UstaadBot({ expression = 'welcoming', size = 80, showLabel = false, gender = 'male' }) {
  const expr = EXPRESSIONS[expression] || EXPRESSIONS.welcoming
  const anim = animations[expr.animation] || {}
  const isFemale = gender === 'female'

  return (
    <div className="flex flex-col items-center gap-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={expression}
          animate={anim}
          initial={{ scale: 0.8, opacity: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ width: size, height: size }}
          className="relative select-none"
        >
          {isFemale
            ? <FemaleBot expr={expr} expression={expression} size={size} />
            : <MaleBot expr={expr} expression={expression} size={size} />
          }
        </motion.div>
      </AnimatePresence>
      {showLabel && <span className="text-xs text-gray-400 font-medium">USTAAD</span>}
    </div>
  )
}

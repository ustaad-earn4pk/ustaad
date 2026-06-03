import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { onboardingAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

const STEPS = [
  { id: 'personal',  title: 'Aapke Baare Mein',   icon: '👤' },
  { id: 'education', title: 'Taleem',              icon: '🎓' },
  { id: 'computer',  title: 'Computer Skills',     icon: '💻' },
  { id: 'goals',     title: 'Aapka Maqsad',        icon: '🎯' },
  { id: 'english',   title: 'English Level',       icon: '🗣️' },
]

const EDUCATION_LEVELS = [
  { value: 'none',         label: 'Koi taleem nahi' },
  { value: 'matric',       label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate / FA / FSc' },
  { value: 'bachelors',    label: 'Bachelors' },
  { value: 'masters',      label: 'Masters ya zyada' },
]

const COMPUTER_SKILLS_LIST = [
  'MS Word / Excel', 'Email', 'Social Media',
  'Canva / Design', 'WordPress', 'Coding / Programming', 'Video Editing',
]

const GOALS = [
  { value: 'freelancing', label: '💰 Freelancing (Upwork/Fiverr)' },
  { value: 'job',         label: '👔 Online Job / Remote Work' },
  { value: 'agency',      label: '🏢 Apni Agency banana' },
  { value: 'personal',    label: '📚 Personal growth / seekhna' },
]

const TIME_OPTIONS = [
  { value: '1hr',    label: '1 Ghanta roz' },
  { value: '2-3hrs', label: '2-3 Ghante roz' },
  { value: '4hrs+',  label: '4+ Ghante roz' },
]

const ENGLISH_LEVELS = [
  { value: 'none',   label: '❌ Bilkul nahi aati' },
  { value: 'basic',  label: '🟡 Thodi — simple sentences' },
  { value: 'medium', label: '🟠 Theek hai — samajh aati hai' },
  { value: 'fluent', label: '🟢 Achi — confidently bol sakta/sakti hun' },
]

const TIMELINE_OPTIONS = [
  { value: '3months', label: '3 Mahine' },
  { value: '6months', label: '6 Mahine' },
  { value: '1year',   label: '1 Saal' },
]

const ALL_TRACKS = [
  { value: 'computer_basics',    label: 'Computer & Internet Basics',  price: 5000,  duration: '30 din', level: 1, desc: 'Computer, internet, email, Google tools — GHL ki foundation' },
  { value: 'web_fundamentals',   label: 'Web & Business Basics',       price: 5000,  duration: '30 din', level: 2, desc: 'Domain, hosting, DNS, WordPress, lead gen concepts' },
  { value: 'ghl_developer',      label: 'GoHighLevel Developer',       price: 7000,  duration: '45 din', level: 3, desc: 'GHL CRM, funnels, workflows, sub-accounts, client onboarding' },
  { value: 'integration_expert', label: 'Integration Expert',          price: 8000,  duration: '45 din', level: 4, desc: 'Zapier, Make.com, n8n, GHL API, AI integration' },
  { value: 'client_hunting',     label: 'Client Hunting & Portfolio',  price: 12000, duration: '45 din', level: 5, desc: 'LinkedIn, Upwork, Fiverr, proposals, pricing, portfolio' },
]

function SelectCard({ options, value, onChange, multi = false }) {
  return (
    <div className="space-y-2">
      {options.map(opt => {
        const selected = multi ? (value || []).includes(opt.value) : value === opt.value
        return (
          <button key={opt.value} type="button"
            onClick={() => {
              if (multi) {
                const current = value || []
                onChange(selected ? current.filter(v => v !== opt.value) : [...current, opt.value])
              } else { onChange(opt.value) }
            }}
            className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${selected ? 'bg-brand-50 border-brand-400 text-brand-700' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function FieldInput({ label, placeholder, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}{required && ' *'}</label>
      <input type={type} placeholder={placeholder} value={value || ''}
        onChange={e => onChange(e.target.value)} className="input w-full" />
    </div>
  )
}

function CourseSelection({ assessment, onSelect, submitting }) {
  const [selected, setSelected] = useState(assessment.recommended_track)
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <UstaadBot expression="celebrating" size={48} />
          <div>
            <p className="font-bold text-gray-900">Assessment Complete! 🎉</p>
            <p className="text-xs text-gray-500">Apna course select karo</p>
          </div>
        </div>
      </div>
      <div className="px-5 pt-5 space-y-4">
        <div className="card bg-brand-50 border border-brand-200">
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-1">USTAAD ki Recommendation</p>
          <p className="font-bold text-gray-900">{ALL_TRACKS.find(t => t.value === assessment.recommended_track)?.label}</p>
          <p className="text-sm text-gray-600 mt-1">{assessment.reason}</p>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Sab Courses</p>
        {ALL_TRACKS.map(track => {
          const isRecommended = track.value === assessment.recommended_track
          const isSelected = track.value === selected
          return (
            <button key={track.value} onClick={() => setSelected(track.value)}
              className={`w-full text-left card transition-all border-2 ${isSelected ? 'border-brand-400 bg-brand-50' : 'border-transparent'} ${isRecommended ? 'ring-2 ring-brand-200' : ''}`}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">{track.level}</span>
                  <p className="font-semibold text-gray-900 text-sm">{track.label}</p>
                </div>
                <div>
                  {isRecommended && <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">Recommended</span>}
                  {isSelected && !isRecommended && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Selected</span>}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2 ml-8">{track.desc}</p>
              <div className="flex items-center gap-3 ml-8">
                <span className="text-xs text-gray-500">⏱ {track.duration}</span>
                <span className="text-sm font-bold text-green-600">PKR {track.price.toLocaleString()}</span>
              </div>
            </button>
          )
        })}
        <button onClick={() => onSelect(selected)} disabled={submitting}
          className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-50">
          {submitting ? 'Processing...' : `${ALL_TRACKS.find(t => t.value === selected)?.label} — Enroll Karo 🚀`}
        </button>
        <p className="text-xs text-gray-400 text-center">Payment ke baad course activate hoga</p>
      </div>
    </motion.div>
  )
}

export default function Onboarding() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  const [form, setForm] = useState({
    full_name: user?.full_name || '', gender: '', age: '', city: user?.city || '',
    address: '', phone: '', education_level: '', education_subject: '',
    currently_studying: false, has_computer_skills: null, computer_skills: [],
    has_laptop: null, internet_quality: '', goal: '', time_per_day: '',
    target_income: '', timeline: '', english_level: '',
    preferred_language: user?.preferred_language || 'en',
  })

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const canNext = () => {
    if (step === 0) return form.full_name && form.gender && form.age && form.city && form.phone
    if (step === 1) return !!form.education_level
    if (step === 2) return form.has_computer_skills !== null && form.has_laptop !== null
    if (step === 3) return form.goal && form.time_per_day
    if (step === 4) return !!form.english_level
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        ...form,
        age: parseInt(form.age) || 0,
        has_computer_skills: form.has_computer_skills === true || form.has_computer_skills === 'true',
        has_laptop: form.has_laptop === true || form.has_laptop === 'true',
      }
      const res = await onboardingAPI.submitForm(payload)
      setAssessment(res.data.assessment)
    } catch (err) {
      setError(err.response?.data?.detail || 'Kuch masla hua. Dobara try karo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnroll = (selectedTrack) => {
    navigate('/pending', { state: { selectedTrack } })
  }

  if (assessment) {
    return <CourseSelection assessment={assessment} onSelect={handleEnroll} submitting={enrolling} />
  }

  const progress = Math.round((step / STEPS.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">‹</button>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{STEPS[step].icon} {STEPS[step].title}</p>
            <p className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</p>
          </div>
          <UstaadBot expression="welcoming" size={36} />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-brand-400 rounded-full" initial={{ width: 0 }}
            animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">

            {step === 0 && <>
              <FieldInput label="Poora Naam" placeholder="Muhammad Ali" value={form.full_name} onChange={v => update('full_name', v)} required />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gender *</label>
                <SelectCard options={[{ value: 'male', label: '👦 Male' }, { value: 'female', label: '👧 Female' }]}
                  value={form.gender} onChange={v => update('gender', v)} />
              </div>
              <FieldInput label="Umar (Age)" placeholder="22" value={form.age} onChange={v => update('age', v)} type="number" required />
              <FieldInput label="Sheher (City)" placeholder="Lahore, Karachi..." value={form.city} onChange={v => update('city', v)} required />
              <FieldInput label="Pata (Address)" placeholder="Mohalla, Gali..." value={form.address} onChange={v => update('address', v)} />
              <FieldInput label="Phone Number" placeholder="03001234567" value={form.phone} onChange={v => update('phone', v)} type="tel" required />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Zabaan Preference</label>
                <SelectCard options={[{ value: 'en', label: '🇬🇧 English' }, { value: 'ur_roman', label: '🇵🇰 Roman Urdu' }, { value: 'ur_nastaliq', label: '🇵🇰 اردو' }]}
                  value={form.preferred_language} onChange={v => update('preferred_language', v)} />
              </div>
            </>}

            {step === 1 && <>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Aapki Education *</label>
                <SelectCard options={EDUCATION_LEVELS} value={form.education_level} onChange={v => update('education_level', v)} />
              </div>
              {form.education_level && form.education_level !== 'none' && (
                <FieldInput label="Kaunsa subject/field?" placeholder="Computer Science, Arts..." value={form.education_subject} onChange={v => update('education_subject', v)} />
              )}
              {form.education_level && form.education_level !== 'none' && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Abhi parh rahe hain?</label>
                  <SelectCard options={[{ value: 'true', label: '✅ Haan' }, { value: 'false', label: '❌ Nahi' }]}
                    value={String(form.currently_studying)} onChange={v => update('currently_studying', v === 'true')} />
                </div>
              )}
            </>}

            {step === 2 && <>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Computer/mobile pe experience? *</label>
                <SelectCard options={[{ value: 'true', label: '✅ Haan, thoda bahut' }, { value: 'false', label: '❌ Nahi, bilkul naya hun' }]}
                  value={form.has_computer_skills === null ? '' : String(form.has_computer_skills)}
                  onChange={v => update('has_computer_skills', v === 'true')} />
              </div>
              {form.has_computer_skills === true && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Kaunsi skills? (multiple)</label>
                  <SelectCard options={COMPUTER_SKILLS_LIST.map(s => ({ value: s, label: s }))}
                    value={form.computer_skills} onChange={v => update('computer_skills', v)} multi />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Laptop/computer hai? *</label>
                <SelectCard options={[{ value: 'true', label: '✅ Haan' }, { value: 'false', label: '❌ Sirf mobile' }]}
                  value={form.has_laptop === null ? '' : String(form.has_laptop)}
                  onChange={v => update('has_laptop', v === 'true')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Internet kaisa hai?</label>
                <SelectCard options={[
                  { value: 'good', label: '🟢 Acha — fast broadband' },
                  { value: 'average', label: '🟡 Theek hai — kabhi slow' },
                  { value: 'poor', label: '🔴 Kamzor — mobile data' },
                ]} value={form.internet_quality} onChange={v => update('internet_quality', v)} />
              </div>
            </>}

            {step === 3 && <>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Aap kya karna chahte hain? *</label>
                <SelectCard options={GOALS} value={form.goal} onChange={v => update('goal', v)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Roz kitna waqt? *</label>
                <SelectCard options={TIME_OPTIONS} value={form.time_per_day} onChange={v => update('time_per_day', v)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Kitne time mein result?</label>
                <SelectCard options={TIMELINE_OPTIONS} value={form.timeline} onChange={v => update('timeline', v)} />
              </div>
              <FieldInput label="Target income (optional)" placeholder="$500/month, 50,000 PKR" value={form.target_income} onChange={v => update('target_income', v)} />
            </>}

            {step === 4 && <>
              <p className="text-sm text-gray-600 mb-3">GHL tools mostly English mein hain.</p>
              <SelectCard options={ENGLISH_LEVELS} value={form.english_level} onChange={v => update('english_level', v)} />
            </>}

          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            className="btn-primary w-full py-3 disabled:opacity-40">Agla Step →</button>
        ) : (
          <button onClick={handleSubmit} disabled={!canNext() || submitting}
            className="btn-primary w-full py-3 disabled:opacity-40">
            {submitting ? 'Assessment ho raha hai...' : 'Mera Course Dhundho 🚀'}
          </button>
        )}
      </div>
    </div>
  )
}

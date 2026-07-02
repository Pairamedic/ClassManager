import { useState } from 'react'
import { getMedication } from '../data/medications'

const ACCENT = {
  red: 'text-ecg-red border-ecg-red',
  blue: 'text-ecg-blue border-ecg-blue',
  amber: 'text-ecg-amber border-ecg-amber',
  green: 'text-ecg-green border-ecg-green',
}

const ACCENT_BG = {
  red: 'bg-ecg-red',
  blue: 'bg-ecg-blue',
  amber: 'bg-ecg-amber',
  green: 'bg-ecg-green',
}

export default function MedicationReviewModal({ drug, onClose }) {
  const med = getMedication(drug)
  const [mode, setMode] = useState('review')          // 'review' | 'quiz' | 'result'
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})           // { [questionIndex]: optionIndex }

  if (!med) return null

  const accentText = ACCENT[med.accent].split(' ')[0]
  const quiz = med.quiz
  const chosen = answers[current]

  function selectAnswer(optIdx) {
    setAnswers(prev => ({ ...prev, [current]: optIdx }))
  }

  function nextQuestion() {
    if (current < quiz.length - 1) setCurrent(current + 1)
    else setMode('result')
  }

  function restartQuiz() {
    setAnswers({})
    setCurrent(0)
    setMode('quiz')
  }

  const score = quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ecg-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink tracking-widest uppercase">
              Medication Review · {med.name}
            </h2>
            <p className={`text-[11px] font-semibold mt-0.5 ${accentText}`}>{med.tagline}</p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1.5 p-3 shrink-0">
          <button
            onClick={() => setMode('review')}
            className={`grow min-h-[36px] px-2 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition-colors ${
              mode === 'review' ? `bg-surface2 ${ACCENT[med.accent]}` : 'border-ecg-border text-ecg-gray hover:text-ink'
            }`}
          >
            Review
          </button>
          <button
            onClick={() => { if (mode === 'result') restartQuiz(); else setMode('quiz') }}
            className={`grow min-h-[36px] px-2 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition-colors ${
              mode !== 'review' ? `bg-surface2 ${ACCENT[med.accent]}` : 'border-ecg-border text-ecg-gray hover:text-ink'
            }`}
          >
            Quiz ({quiz.length} Q)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {mode === 'review' && (
            <div className="space-y-4">
              {med.sections.map((sec, i) => (
                <div key={i}>
                  <div className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${accentText}`}>
                    {sec.heading}
                  </div>
                  <ul className="space-y-1">
                    {sec.points.map((pt, j) => (
                      <li key={j} className="flex gap-2 text-[13px] text-ink/90 leading-snug">
                        <span className={`shrink-0 ${accentText}`}>•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button
                onClick={() => setMode('quiz')}
                className={`w-full mt-2 rounded-lg border-2 py-2.5 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all ${ACCENT[med.accent]} hover:bg-surface2`}
              >
                Start Quiz →
              </button>
              <p className="text-[10px] text-ecg-gray pt-2 border-t border-ecg-border">
                Teaching reference, AHA 2020 guidelines. Follow your program’s current protocols.
              </p>
            </div>
          )}

          {mode === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ecg-gray font-mono uppercase tracking-widest">
                  Question {current + 1} of {quiz.length}
                </span>
                <div className="flex gap-1">
                  {quiz.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-6 rounded-full ${
                        i === current ? ACCENT_BG[med.accent]
                        : answers[i] !== undefined ? 'bg-ecg-gray' : 'bg-ecg-border'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[14px] text-ink font-semibold leading-snug">{quiz[current].q}</p>

              <div className="space-y-2">
                {quiz[current].options.map((opt, i) => {
                  const isChosen = chosen === i
                  const isCorrect = i === quiz[current].answer
                  let cls = 'border-ecg-border text-ink/90 hover:border-ink/40'
                  if (chosen !== undefined) {
                    if (isCorrect) cls = 'border-ecg-green text-ecg-green bg-ecg-green/10'
                    else if (isChosen) cls = 'border-ecg-red text-ecg-red bg-ecg-red/10'
                    else cls = 'border-ecg-border text-ecg-gray'
                  }
                  return (
                    <button
                      key={i}
                      disabled={chosen !== undefined}
                      onClick={() => selectAnswer(i)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 text-[13px] leading-snug transition-colors disabled:cursor-default ${cls}`}
                    >
                      <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>

              {chosen !== undefined && (
                <button
                  onClick={nextQuestion}
                  className={`w-full rounded-lg border-2 py-2.5 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all ${ACCENT[med.accent]} hover:bg-surface2`}
                >
                  {current < quiz.length - 1 ? 'Next Question →' : 'See Results →'}
                </button>
              )}
            </div>
          )}

          {mode === 'result' && (
            <div className="space-y-4 text-center py-2">
              <div className={`text-4xl font-black ${accentText}`}>
                {score} / {quiz.length}
              </div>
              <p className="text-[13px] text-ink/90 font-semibold">
                {score === quiz.length ? 'Perfect — you know your ' + med.name + '!'
                  : score >= quiz.length - 1 ? 'Great work — almost perfect.'
                  : score >= quiz.length / 2 ? 'Good effort — review the highlighted items.'
                  : 'Keep at it — revisit the review section.'}
              </p>

              <div className="text-left space-y-2 pt-2">
                {quiz.map((q, i) => {
                  const correct = answers[i] === q.answer
                  return (
                    <div key={i} className="rounded-lg border border-ecg-border p-2.5">
                      <div className="flex gap-2 text-[12px]">
                        <span className={correct ? 'text-ecg-green' : 'text-ecg-red'}>
                          {correct ? '✓' : '✗'}
                        </span>
                        <div>
                          <p className="text-ink/90 font-semibold leading-snug">{q.q}</p>
                          {!correct && (
                            <p className="text-[11px] text-ecg-green mt-1">
                              Correct: {q.options[q.answer]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={restartQuiz}
                  className={`grow rounded-lg border-2 py-2.5 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all ${ACCENT[med.accent]} hover:bg-surface2`}
                >
                  Retake Quiz
                </button>
                <button
                  onClick={() => setMode('review')}
                  className="grow rounded-lg border border-ecg-border text-ecg-gray py-2.5 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors"
                >
                  Back to Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

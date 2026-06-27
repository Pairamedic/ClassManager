// AHA ACLS algorithm reference content (2020 guidelines / PAM-aligned).
// Concise teaching summaries — not a substitute for the official algorithm cards.

export const ALGORITHMS = [
  {
    id: 'arrest',
    title: 'Cardiac Arrest',
    accent: 'red',
    sections: [
      {
        heading: 'Start',
        steps: [
          'Start high-quality CPR, give oxygen, attach monitor/defibrillator.',
          'Assess rhythm — is it shockable?',
        ],
      },
      {
        heading: 'VF / pulseless VT (shockable)',
        steps: [
          'Shock.',
          'CPR 2 min — IV/IO access.',
          'Shock. CPR 2 min — Epinephrine 1 mg q3–5 min; consider advanced airway + capnography.',
          'Shock. CPR 2 min — Amiodarone 300 mg (then 150 mg) or Lidocaine; treat reversible causes.',
        ],
      },
      {
        heading: 'Asystole / PEA (non-shockable)',
        steps: [
          'CPR 2 min — Epinephrine 1 mg ASAP, then q3–5 min.',
          'Consider advanced airway + capnography.',
          'Treat reversible causes (H’s & T’s).',
          'If rhythm becomes shockable, move to the VF/pVT pathway.',
        ],
      },
      {
        heading: 'High-quality CPR',
        steps: [
          'Rate 100–120/min, depth ≥2 in (5 cm), allow full recoil.',
          'Minimize interruptions; change compressor every 2 min.',
          'Avoid excessive ventilation.',
          'Biphasic defibrillation: manufacturer dose (120–200 J); monophasic 360 J.',
          'ROSC: pulse + blood pressure, abrupt sustained rise in ETCO₂ (≈40 mmHg).',
        ],
      },
    ],
  },
  {
    id: 'brady',
    title: 'Bradycardia',
    accent: 'blue',
    sections: [
      {
        heading: 'Assess (HR < 50 with symptoms)',
        steps: [
          'Identify and treat the underlying cause.',
          'Maintain airway; oxygen if hypoxemic.',
          'Monitor, IV access, 12-lead ECG.',
        ],
      },
      {
        heading: 'Persistent bradyarrhythmia causing:',
        steps: [
          'Hypotension, acutely altered mental status,',
          'signs of shock, ischemic chest discomfort,',
          'or acute heart failure?',
        ],
      },
      {
        heading: 'If yes — treat',
        steps: [
          'Atropine 1 mg IV bolus; repeat q3–5 min (max 3 mg).',
          'If ineffective: transcutaneous pacing,',
          'and/or Dopamine 5–20 mcg/kg/min,',
          'or Epinephrine 2–10 mcg/min infusion.',
          'Consider expert consult / transvenous pacing.',
        ],
      },
    ],
  },
  {
    id: 'tachy',
    title: 'Tachycardia',
    accent: 'amber',
    sections: [
      {
        heading: 'Assess (HR ≥ 150 with symptoms)',
        steps: [
          'Identify and treat the underlying cause.',
          'Maintain airway; oxygen if hypoxemic.',
          'Monitor, IV access, 12-lead ECG.',
        ],
      },
      {
        heading: 'Unstable? (hypotension, AMS, shock, chest pain, acute HF)',
        steps: [
          'Synchronized cardioversion (consider sedation).',
          'If regular narrow complex, consider adenosine first.',
        ],
      },
      {
        heading: 'Stable — wide QRS (≥ 0.12 s)',
        steps: [
          'Adenosine only if regular and monomorphic.',
          'Antiarrhythmic infusion: procainamide, amiodarone, or sotalol.',
          'Expert consultation.',
        ],
      },
      {
        heading: 'Stable — narrow QRS',
        steps: [
          'Vagal maneuvers.',
          'Adenosine 6 mg rapid IV push, then 12 mg if needed (if regular).',
          'Beta-blocker or calcium channel blocker.',
          'Expert consultation.',
        ],
      },
    ],
  },
  {
    id: 'postarrest',
    title: 'Post-Arrest',
    accent: 'green',
    sections: [
      {
        heading: 'Immediately after ROSC',
        steps: [
          'Manage airway; titrate to SpO₂ 92–98%, avoid hyperoxia.',
          'Ventilate ~10/min; target PaCO₂ 35–45 mmHg (ETCO₂ ~35–40).',
          'Treat hypotension (SBP < 90): IV bolus, vasopressors as needed.',
        ],
      },
      {
        heading: 'Diagnose & treat',
        steps: [
          'Obtain 12-lead ECG — STEMI or high suspicion of ACS?',
          'If yes → coronary reperfusion / cath lab.',
          'Continue to treat reversible causes (H’s & T’s).',
        ],
      },
      {
        heading: 'Ongoing care',
        steps: [
          'Comatose: targeted temperature management (32–36 °C).',
          'Continuous monitoring, glucose control, evaluate for cause.',
          'Avoid hyperthermia; serial neuro exams.',
        ],
      },
    ],
  },
  {
    id: 'acs',
    title: 'ACS',
    accent: 'amber',
    sections: [
      {
        heading: 'Initial (suspected ACS)',
        steps: [
          'Monitor, IV access, oxygen if SpO₂ < 90%.',
          'Obtain 12-lead ECG within 10 minutes.',
          'Aspirin 162–325 mg chewed (if no contraindication).',
          'Nitroglycerin and morphine for ongoing pain as indicated.',
        ],
      },
      {
        heading: 'STEMI (ST elevation)',
        steps: [
          'Activate cath lab — goal door-to-balloon ≤ 90 min.',
          'If PCI unavailable in time, consider fibrinolytics (≤ 30 min).',
          'Antithrombotics per protocol.',
        ],
      },
      {
        heading: 'NSTE-ACS',
        steps: [
          'Risk-stratify (troponin, serial ECG).',
          'Antiplatelet / anticoagulant therapy.',
          'Admit for invasive vs ischemia-guided strategy.',
        ],
      },
    ],
  },
  {
    id: 'opioid',
    title: 'Opioid',
    accent: 'blue',
    sections: [
      {
        heading: 'Suspected opioid emergency',
        steps: [
          'Check responsiveness and breathing; call for help.',
          'If not breathing normally but has pulse → support ventilation (BVM).',
          'Naloxone 0.4–2 mg IV/IM/IN; repeat q2–3 min as needed.',
        ],
      },
      {
        heading: 'No pulse',
        steps: [
          'Begin CPR — follow the Cardiac Arrest algorithm.',
          'Naloxone may be given but does not replace CPR/defibrillation.',
        ],
      },
    ],
  },
  {
    id: 'stroke',
    title: 'Stroke',
    accent: 'red',
    sections: [
      {
        heading: 'Identify & assess',
        steps: [
          'Recognize signs (FAST); establish last-known-well time.',
          'Monitor, IV access, check glucose, oxygen if needed.',
          'Stroke screen + severity scale.',
        ],
      },
      {
        heading: 'Time-critical',
        steps: [
          'Activate stroke team; non-contrast CT/MRI ASAP.',
          'Hemorrhage on imaging → consult neurosurgery; reverse anticoagulation.',
          'Ischemic + eligible → fibrinolytics; consider thrombectomy.',
        ],
      },
    ],
  },
]

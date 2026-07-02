// ACLS Medication Review content — concise teaching summaries with a short
// self-check quiz for each drug. Keyed by drug name (matches MedLogPanel MEDS).
// Teaching reference, AHA 2020 guidelines. Not a substitute for official protocols.

export const MEDICATIONS = {
  Epinephrine: {
    name: 'Epinephrine',
    accent: 'red',
    tagline: 'Vasopressor — first-line in cardiac arrest',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Endogenous catecholamine with α- and β-adrenergic activity.',
          'α-1 vasoconstriction raises aortic diastolic pressure, improving coronary and cerebral perfusion during CPR.',
          'β effects increase heart rate and contractility.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'All cardiac arrest rhythms: VF, pulseless VT, asystole, PEA.',
          'Symptomatic bradycardia (infusion) unresponsive to atropine.',
          'Anaphylaxis and severe hypotension/shock.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Arrest: 1 mg (10 mL of 1:10,000) IV/IO every 3–5 minutes.',
          'Give as soon as possible for non-shockable rhythms (asystole/PEA).',
          'Bradycardia/shock infusion: 2–10 mcg/min, titrate to effect.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Increases myocardial oxygen demand.',
          'Do not mix with sodium bicarbonate (inactivated by alkaline solutions).',
          'Flush with 20 mL and raise the limb after peripheral IV/IO push.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the standard IV/IO dose of epinephrine in adult cardiac arrest?',
        options: ['0.5 mg every 10 min', '1 mg every 3–5 min', '300 mg once', '2–10 mcg/min'],
        answer: 1,
      },
      {
        q: 'For which arrest rhythm should epinephrine be given as soon as possible?',
        options: ['VF', 'Pulseless VT', 'Asystole / PEA', 'It is never used in arrest'],
        answer: 2,
      },
      {
        q: 'Which receptor effect of epinephrine most improves coronary perfusion during CPR?',
        options: ['α-1 vasoconstriction', 'β-2 bronchodilation', 'Muscarinic blockade', 'Sodium-channel blockade'],
        answer: 0,
      },
      {
        q: 'Epinephrine should NOT be given in the same line at the same time as which drug?',
        options: ['Amiodarone', 'Sodium bicarbonate', 'Normal saline', 'Atropine'],
        answer: 1,
      },
    ],
  },

  Amiodarone: {
    name: 'Amiodarone',
    accent: 'amber',
    tagline: 'Antiarrhythmic — shock-refractory VF/pulseless VT',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Class III antiarrhythmic that prolongs the action potential and refractory period.',
          'Also has sodium-, potassium-, calcium-channel and β-blocking properties.',
          'Stabilizes cardiac membranes and raises the fibrillation threshold.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'VF or pulseless VT unresponsive to CPR, defibrillation, and a vasopressor.',
          'Stable wide-complex tachycardia / VT with a pulse.',
          'Rate control of some atrial arrhythmias.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Arrest: 300 mg IV/IO bolus first, then 150 mg IV/IO for a second dose.',
          'Stable VT (with pulse): 150 mg over 10 minutes, may repeat.',
          'Maintenance infusion: 1 mg/min for 6 h, then 0.5 mg/min.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'May cause hypotension and bradycardia (especially with fast infusion).',
          'Can prolong the QT interval — avoid combining with other QT-prolonging drugs.',
          'Given after epinephrine in the shockable-rhythm sequence.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the FIRST amiodarone dose in refractory VF/pulseless VT?',
        options: ['150 mg IV/IO', '300 mg IV/IO', '1 mg IV/IO', '6 mg IV/IO'],
        answer: 1,
      },
      {
        q: 'What is the SECOND (repeat) dose of amiodarone in cardiac arrest?',
        options: ['150 mg IV/IO', '300 mg IV/IO', '2 g IV/IO', '0.5 mg IV/IO'],
        answer: 0,
      },
      {
        q: 'Amiodarone is primarily classified as which type of antiarrhythmic?',
        options: ['Class I (sodium blocker)', 'Class II (β-blocker)', 'Class III (potassium blocker)', 'Class IV (calcium blocker)'],
        answer: 2,
      },
      {
        q: 'Amiodarone is indicated in arrest only after which interventions have failed?',
        options: [
          'Only after atropine',
          'CPR, defibrillation, and a vasopressor',
          'Only after adenosine',
          'It is given before any CPR',
        ],
        answer: 1,
      },
    ],
  },

  Adenosine: {
    name: 'Adenosine',
    accent: 'blue',
    tagline: 'Antiarrhythmic — stable narrow-complex SVT',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Endogenous nucleoside that briefly slows AV-node conduction.',
          'Interrupts reentry circuits that pass through the AV node.',
          'Very short half-life (< 10 seconds).',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Stable, regular, narrow-complex SVT (e.g., AVNRT).',
          'Diagnostic/therapeutic in regular monomorphic wide-complex tachycardia if SVT suspected.',
          'Not effective for atrial fibrillation, flutter, or VT.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'First dose: 6 mg rapid IV push over 1–3 seconds.',
          'Second dose: 12 mg rapid IV push if no conversion in 1–2 minutes.',
          'Follow each dose with a rapid 20 mL saline flush; use a proximal (AC) vein.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Expect a brief period of asystole/flushing/chest pressure — warn the patient.',
          'Higher doses may be needed with caffeine/theophylline; lower with dipyridamole or carbamazepine.',
          'Use caution in reactive airway disease.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the first dose of adenosine for stable SVT?',
        options: ['1 mg IV', '6 mg rapid IV push', '12 mg slow IV', '300 mg IV'],
        answer: 1,
      },
      {
        q: 'If the first dose fails to convert SVT, the second adenosine dose is:',
        options: ['3 mg', '6 mg again', '12 mg', '18 mg'],
        answer: 2,
      },
      {
        q: 'Why must adenosine be given as a rapid push followed by a saline flush?',
        options: [
          'It is painful if given slowly',
          'It has an extremely short half-life',
          'It precipitates in the line',
          'It causes clotting',
        ],
        answer: 1,
      },
      {
        q: 'Adenosine is the drug of choice for which rhythm?',
        options: [
          'Atrial fibrillation',
          'Polymorphic VT',
          'Stable regular narrow-complex SVT',
          'Asystole',
        ],
        answer: 2,
      },
    ],
  },

  Atropine: {
    name: 'Atropine',
    accent: 'green',
    tagline: 'Anticholinergic — symptomatic bradycardia',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Anticholinergic (muscarinic antagonist).',
          'Blocks vagal tone at the SA and AV nodes, increasing heart rate.',
          'Most effective for bradycardia arising above the AV node.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Symptomatic bradycardia (hypotension, altered mental status, ischemia, shock).',
          'First-line drug while preparing pacing or vasopressor infusions.',
          'Organophosphate / cholinergic poisoning (much larger doses).',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Bradycardia: 1 mg IV every 3–5 minutes.',
          'Maximum total dose: 3 mg.',
          'If ineffective, move to transcutaneous pacing or epinephrine/dopamine infusion.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Doses below 0.5 mg may cause paradoxical bradycardia.',
          'Often ineffective in high-grade (Mobitz II / third-degree) AV block or wide-complex escape — do not delay pacing.',
          'No longer recommended for routine use in asystole/PEA.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the atropine dose for symptomatic bradycardia?',
        options: ['0.1 mg IV', '1 mg IV every 3–5 min', '6 mg IV push', '2 g IV'],
        answer: 1,
      },
      {
        q: 'What is the maximum total dose of atropine in bradycardia?',
        options: ['1 mg', '2 mg', '3 mg', '5 mg'],
        answer: 2,
      },
      {
        q: 'How does atropine increase heart rate?',
        options: [
          'β-1 stimulation',
          'Blocking vagal (muscarinic) tone at the SA/AV nodes',
          'Sodium-channel blockade',
          'Calcium-channel blockade',
        ],
        answer: 1,
      },
      {
        q: 'In which situation is atropine often ineffective, so pacing should not be delayed?',
        options: [
          'Sinus bradycardia',
          'Mobitz II / third-degree AV block',
          'Anxiety',
          'Fever',
        ],
        answer: 1,
      },
    ],
  },

  Lidocaine: {
    name: 'Lidocaine',
    accent: 'blue',
    tagline: 'Antiarrhythmic — alternative to amiodarone',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Class Ib antiarrhythmic (sodium-channel blocker).',
          'Suppresses ventricular ectopy and raises the VF threshold.',
          'Shortens the action-potential duration in ventricular tissue.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Alternative to amiodarone in shock-refractory VF / pulseless VT.',
          'Stable ventricular tachycardia with a pulse.',
          'Especially considered when arrest is due to ischemia.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Arrest: 1–1.5 mg/kg IV/IO first dose.',
          'Repeat: 0.5–0.75 mg/kg every 5–10 min, max 3 mg/kg total.',
          'Maintenance infusion: 1–4 mg/min after return of circulation.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Toxicity: slurred speech, altered mental status, seizures, bradycardia.',
          'Reduce dose in hepatic dysfunction, heart failure, or the elderly.',
          'Do not combine routinely with amiodarone (additive proarrhythmia).',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the initial IV/IO dose of lidocaine in cardiac arrest?',
        options: ['0.5 mg/kg', '1–1.5 mg/kg', '3 mg/kg', '300 mg flat'],
        answer: 1,
      },
      {
        q: 'What is the maximum total dose of lidocaine?',
        options: ['1 mg/kg', '2 mg/kg', '3 mg/kg', '5 mg/kg'],
        answer: 2,
      },
      {
        q: 'Lidocaine is classified as which antiarrhythmic type?',
        options: ['Class Ib (sodium blocker)', 'Class II (β-blocker)', 'Class III (potassium blocker)', 'Class IV (calcium blocker)'],
        answer: 0,
      },
      {
        q: 'Lidocaine is primarily used as an alternative to which arrest drug?',
        options: ['Epinephrine', 'Atropine', 'Amiodarone', 'Adenosine'],
        answer: 2,
      },
    ],
  },

  Magnesium: {
    name: 'Magnesium',
    accent: 'green',
    tagline: 'Electrolyte — torsades de pointes',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Essential electrolyte and cofactor that stabilizes cardiac membranes.',
          'Suppresses early afterdepolarizations that trigger torsades.',
          'Helps correct the substrate in QT-prolongation.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Torsades de pointes (polymorphic VT with a long QT).',
          'Suspected hypomagnesemia.',
          'Not recommended for routine use in cardiac arrest without torsades.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Arrest with torsades: 1–2 g IV/IO diluted, given as a bolus.',
          'Torsades with a pulse: 1–2 g over 5–60 minutes.',
          'Follow with an infusion if recurrent.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Rapid administration can cause hypotension and bradycardia.',
          'Excess magnesium causes flushing, respiratory depression, and loss of reflexes.',
          'Use caution in renal failure.',
        ],
      },
    ],
    quiz: [
      {
        q: 'Magnesium sulfate is specifically indicated for which rhythm?',
        options: ['Asystole', 'Torsades de pointes', 'Atrial fibrillation', 'Sinus bradycardia'],
        answer: 1,
      },
      {
        q: 'What is the typical magnesium dose for torsades in arrest?',
        options: ['0.5 g', '1–2 g IV/IO', '10 g', '100 mg'],
        answer: 1,
      },
      {
        q: 'Torsades de pointes is associated with what ECG finding?',
        options: ['Short PR interval', 'Prolonged QT interval', 'Delta wave', 'ST depression only'],
        answer: 1,
      },
      {
        q: 'Which is a risk of giving magnesium too rapidly?',
        options: ['Hypertension', 'Tachycardia', 'Hypotension and bradycardia', 'Hyperreflexia'],
        answer: 2,
      },
    ],
  },

  'Sodium Bicarb': {
    name: 'Sodium Bicarbonate',
    accent: 'amber',
    tagline: 'Buffer — specific arrest circumstances',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Alkalinizing buffer that neutralizes metabolic acid.',
          'Shifts potassium back into cells (helps hyperkalemia).',
          'Enhances protein binding of tricyclic antidepressants.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Known pre-existing metabolic acidosis or hyperkalemia.',
          'Tricyclic antidepressant or other sodium-channel-blocker overdose.',
          'Not recommended for routine use in cardiac arrest.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Typical: 1 mEq/kg IV/IO initial dose.',
          'Guide further dosing with arterial blood gas / bicarbonate levels when available.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Inactivates catecholamines (epinephrine) and precipitates calcium — flush the line.',
          'Can cause metabolic alkalosis, hypernatremia, and hyperosmolality.',
          'Does not replace adequate ventilation for clearing CO₂.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the typical initial dose of sodium bicarbonate?',
        options: ['0.1 mEq/kg', '1 mEq/kg', '10 mEq/kg', '1 mg/kg'],
        answer: 1,
      },
      {
        q: 'Sodium bicarbonate is specifically indicated in which situation?',
        options: [
          'Routine cardiac arrest',
          'Known hyperkalemia or TCA overdose',
          'Torsades de pointes',
          'Stable SVT',
        ],
        answer: 1,
      },
      {
        q: 'Why should sodium bicarbonate not share a line with epinephrine or calcium?',
        options: [
          'It is too viscous',
          'It inactivates catecholamines and precipitates calcium',
          'It is light-sensitive',
          'It causes clotting',
        ],
        answer: 1,
      },
      {
        q: 'Sodium bicarbonate for routine cardiac arrest is:',
        options: ['Strongly recommended', 'Not recommended', 'First-line', 'Required before epinephrine'],
        answer: 1,
      },
    ],
  },

  Dopamine: {
    name: 'Dopamine',
    accent: 'red',
    tagline: 'Vasopressor / inotrope — bradycardia & hypotension',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Catecholamine with dose-dependent receptor effects.',
          'Moderate doses (β-1) increase heart rate and contractility.',
          'Higher doses (α-1) cause vasoconstriction and raise blood pressure.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Symptomatic bradycardia unresponsive to atropine (alternative to pacing).',
          'Hypotension/shock after return of spontaneous circulation.',
          'Second-line to epinephrine infusion for bradycardia.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Infusion: 2–20 mcg/kg/min, titrated to response.',
          'Titrate to target heart rate and blood pressure.',
          'Administer via infusion pump, ideally through a central line.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Can cause tachyarrhythmias and increased myocardial oxygen demand.',
          'Correct hypovolemia before starting.',
          'Extravasation causes tissue necrosis (α-mediated vasoconstriction).',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the usual dopamine infusion range for bradycardia/hypotension?',
        options: ['1 mg IV push', '2–20 mcg/kg/min', '300 mg bolus', '6 mg rapid push'],
        answer: 1,
      },
      {
        q: 'Dopamine is used for symptomatic bradycardia when what drug has failed?',
        options: ['Amiodarone', 'Atropine', 'Adenosine', 'Magnesium'],
        answer: 1,
      },
      {
        q: 'At higher infusion rates, dopamine primarily acts on which receptors to raise BP?',
        options: ['α-1 (vasoconstriction)', 'Muscarinic', 'β-2 (bronchodilation)', 'Sodium channels'],
        answer: 0,
      },
      {
        q: 'Which is a key risk of dopamine infusion?',
        options: ['Bradycardia', 'Tachyarrhythmias / increased myocardial O₂ demand', 'Hypoglycemia', 'Prolonged asystole'],
        answer: 1,
      },
    ],
  },
}

// PALS Medication Review content — pediatric weight-based dosing, keyed by the
// same drug names as MEDICATIONS. Teaching reference, AHA 2020 PALS guidelines.
export const PEDIATRIC_MEDICATIONS = {
  Epinephrine: {
    name: 'Epinephrine',
    accent: 'red',
    tagline: 'Vasopressor — first-line in pediatric cardiac arrest',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Endogenous catecholamine with α- and β-adrenergic activity.',
          'α-1 vasoconstriction raises aortic diastolic pressure, improving coronary and cerebral perfusion during CPR.',
          'β effects increase heart rate and contractility.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'All pediatric cardiac arrest rhythms: VF, pulseless VT, asystole, PEA.',
          'Symptomatic bradycardia with poor perfusion unresponsive to oxygenation/ventilation.',
          'Anaphylaxis and severe hypotension/shock.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Arrest: 0.01 mg/kg (0.1 mL/kg of 1:10,000) IV/IO every 3–5 minutes, max single dose 1 mg.',
          'Use the Broselow zone weight to calculate the exact mg dose.',
          'Bradycardia infusion: 0.1–1 mcg/kg/min, titrate to effect.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Weight-based dosing is essential — verify against the Broselow zone before giving.',
          'Do not mix with sodium bicarbonate (inactivated by alkaline solutions).',
          'Flush with saline and raise the limb after peripheral IV/IO push.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the standard IV/IO dose of epinephrine in pediatric cardiac arrest?',
        options: ['0.01 mg/kg every 3–5 min', '1 mg flat every 10 min', '0.1 mg/kg once', '5 mg/kg once'],
        answer: 0,
      },
      {
        q: 'What is the maximum single dose of epinephrine in a pediatric arrest, regardless of weight?',
        options: ['0.5 mg', '1 mg', '2 mg', 'No maximum'],
        answer: 1,
      },
      {
        q: 'Which receptor effect of epinephrine most improves coronary perfusion during CPR?',
        options: ['α-1 vasoconstriction', 'β-2 bronchodilation', 'Muscarinic blockade', 'Sodium-channel blockade'],
        answer: 0,
      },
      {
        q: 'Before giving weight-based epinephrine, what should you confirm?',
        options: ['The patient\'s age in months only', 'The Broselow zone / estimated weight', 'The rhythm on the monitor only', 'Nothing — dose is always 1 mg'],
        answer: 1,
      },
    ],
  },

  Amiodarone: {
    name: 'Amiodarone',
    accent: 'amber',
    tagline: 'Antiarrhythmic — shock-refractory pediatric VF/pulseless VT',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Class III antiarrhythmic that prolongs the action potential and refractory period.',
          'Also has sodium-, potassium-, calcium-channel and β-blocking properties.',
          'Stabilizes cardiac membranes and raises the fibrillation threshold.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'VF or pulseless VT unresponsive to CPR, defibrillation, and epinephrine.',
          'Stable wide-complex tachycardia / VT with a pulse.',
          'SVT refractory to adenosine/vagal maneuvers (specialist-guided).',
        ],
      },
      {
        heading: 'Dose',
        points: [
          '5 mg/kg IV/IO bolus, max single dose 300 mg.',
          'May repeat up to two times for refractory VF/pulseless VT, max cumulative 15 mg/kg/day.',
          'Stable VT (with pulse): 5 mg/kg over 20–60 minutes.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'May cause hypotension and bradycardia (especially with fast infusion).',
          'Can prolong the QT interval — avoid combining with other QT-prolonging drugs.',
          'Given after epinephrine in the shockable-rhythm sequence.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the pediatric amiodarone dose in refractory VF/pulseless VT?',
        options: ['1 mg/kg', '5 mg/kg (max 300 mg)', '0.02 mg/kg', '50 mg/kg'],
        answer: 1,
      },
      {
        q: 'Amiodarone is primarily classified as which type of antiarrhythmic?',
        options: ['Class I (sodium blocker)', 'Class II (β-blocker)', 'Class III (potassium blocker)', 'Class IV (calcium blocker)'],
        answer: 2,
      },
      {
        q: 'How many times may the pediatric amiodarone bolus be repeated in refractory arrest?',
        options: ['Never repeated', 'Up to two times', 'Up to five times', 'Unlimited'],
        answer: 1,
      },
      {
        q: 'Amiodarone is indicated in pediatric arrest only after which interventions have failed?',
        options: ['Only after atropine', 'CPR, defibrillation, and epinephrine', 'Only after adenosine', 'It is given before any CPR'],
        answer: 1,
      },
    ],
  },

  Adenosine: {
    name: 'Adenosine',
    accent: 'blue',
    tagline: 'Antiarrhythmic — pediatric SVT',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Endogenous nucleoside that briefly slows AV-node conduction.',
          'Interrupts reentry circuits that pass through the AV node.',
          'Very short half-life (< 10 seconds).',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Regular, narrow-complex SVT — the most common significant pediatric tachyarrhythmia.',
          'Distinguishing SVT (typically >220 bpm infant / >180 bpm child, abrupt onset, no beat-to-beat variability) from sinus tachycardia.',
          'Not effective for atrial fibrillation, flutter, or VT.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'First dose: 0.1 mg/kg rapid IV/IO push, max 6 mg.',
          'Second dose: 0.2 mg/kg rapid IV/IO push if no conversion, max 12 mg.',
          'Follow each dose with a rapid saline flush; use the largest, most proximal vein available.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Expect a brief period of asystole/flushing/discomfort — warn caregivers.',
          'Try vagal maneuvers first if the child is stable and it will not delay treatment.',
          'Use caution in reactive airway disease.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the first pediatric dose of adenosine for SVT?',
        options: ['0.01 mg/kg', '0.1 mg/kg rapid IV push (max 6 mg)', '1 mg/kg slow IV', '5 mg/kg IV'],
        answer: 1,
      },
      {
        q: 'If the first dose fails to convert SVT, the second adenosine dose is:',
        options: ['0.1 mg/kg again', '0.2 mg/kg (max 12 mg)', '1 mg/kg', 'No second dose is given'],
        answer: 1,
      },
      {
        q: 'A key feature distinguishing SVT from sinus tachycardia in a child is:',
        options: ['Gradual onset with variable rate', 'Abrupt onset with a fixed, very rapid rate and no beat-to-beat variability', 'Always a wide QRS', 'Only occurs in adolescents'],
        answer: 1,
      },
      {
        q: 'What should be tried before adenosine in a stable child with SVT, if it will not delay care?',
        options: ['Vagal maneuvers', 'Defibrillation', 'Atropine', 'Sodium bicarbonate'],
        answer: 0,
      },
    ],
  },

  Atropine: {
    name: 'Atropine',
    accent: 'green',
    tagline: 'Anticholinergic — pediatric symptomatic bradycardia',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Anticholinergic (muscarinic antagonist).',
          'Blocks vagal tone at the SA and AV nodes, increasing heart rate.',
          'Most useful for bradycardia from increased vagal tone (e.g., during intubation).',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Symptomatic bradycardia due to increased vagal tone or primary AV block.',
          'Pre-intubation to blunt vagal-mediated bradycardia in select cases.',
          'Note: in children, bradycardia is most often from hypoxia — prioritize oxygenation/ventilation first.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          '0.02 mg/kg IV/IO.',
          'Minimum single dose 0.1 mg (to avoid paradoxical bradycardia); max single dose 0.5 mg.',
          'May repeat once; max total dose 1 mg (child) / 3 mg (adolescent).',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Doses below 0.1 mg may cause paradoxical bradycardia.',
          'Does not treat hypoxia-driven bradycardia — ensure adequate oxygenation/ventilation and epinephrine first.',
          'Ineffective in high-grade AV block — do not delay pacing/epinephrine.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the pediatric atropine dose for symptomatic bradycardia?',
        options: ['0.02 mg/kg (min 0.1 mg, max 0.5 mg)', '1 mg flat dose', '5 mg/kg', '0.5 mg/kg'],
        answer: 0,
      },
      {
        q: 'Why is there a minimum single dose for atropine?',
        options: ['To save drug supply', 'Doses that are too low can cause paradoxical bradycardia', 'It tastes bad', 'It is required by law'],
        answer: 1,
      },
      {
        q: 'In children, bradycardia is most commonly caused by:',
        options: ['Primary cardiac disease', 'Hypoxia', 'Hyperthyroidism', 'Medication overdose only'],
        answer: 1,
      },
      {
        q: 'Before giving atropine for bradycardia in a child, you should first ensure:',
        options: ['Adequate oxygenation and ventilation', 'The child has eaten recently', 'IV access in the leg specifically', 'A 12-lead ECG has been done'],
        answer: 0,
      },
    ],
  },

  Lidocaine: {
    name: 'Lidocaine',
    accent: 'blue',
    tagline: 'Antiarrhythmic — alternative to amiodarone in pediatric arrest',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Class Ib antiarrhythmic (sodium-channel blocker).',
          'Suppresses ventricular ectopy and raises the VF threshold.',
          'Shortens the action-potential duration in ventricular tissue.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Alternative to amiodarone in shock-refractory pediatric VF / pulseless VT.',
          'Stable ventricular tachycardia with a pulse.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          '1 mg/kg IV/IO loading dose.',
          'Maintenance infusion: 20–50 mcg/kg/min after return of circulation.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Toxicity: altered mental status, seizures, bradycardia.',
          'Reduce dose in hepatic dysfunction or low cardiac output states.',
          'Do not combine routinely with amiodarone (additive proarrhythmia).',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the initial IV/IO loading dose of lidocaine in pediatric cardiac arrest?',
        options: ['0.1 mg/kg', '1 mg/kg', '5 mg/kg', '50 mg/kg'],
        answer: 1,
      },
      {
        q: 'Lidocaine is classified as which antiarrhythmic type?',
        options: ['Class Ib (sodium blocker)', 'Class II (β-blocker)', 'Class III (potassium blocker)', 'Class IV (calcium blocker)'],
        answer: 0,
      },
      {
        q: 'Lidocaine is primarily used as a pediatric alternative to which arrest drug?',
        options: ['Epinephrine', 'Atropine', 'Amiodarone', 'Adenosine'],
        answer: 2,
      },
      {
        q: 'A sign of lidocaine toxicity in a child is:',
        options: ['Hypertension', 'Altered mental status / seizures', 'Polyuria', 'Rash only'],
        answer: 1,
      },
    ],
  },

  Magnesium: {
    name: 'Magnesium',
    accent: 'green',
    tagline: 'Electrolyte — pediatric torsades de pointes',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Essential electrolyte and cofactor that stabilizes cardiac membranes.',
          'Suppresses early afterdepolarizations that trigger torsades.',
          'Helps correct the substrate in QT-prolongation.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Torsades de pointes (polymorphic VT with a long QT).',
          'Suspected hypomagnesemia (e.g., severe asthma, malnutrition).',
        ],
      },
      {
        heading: 'Dose',
        points: [
          '25–50 mg/kg IV/IO, max 2 g, given over 10–20 minutes (faster if pulseless torsades).',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Rapid administration can cause hypotension and bradycardia.',
          'Excess magnesium causes flushing, respiratory depression, and loss of reflexes.',
          'Use caution in renal impairment.',
        ],
      },
    ],
    quiz: [
      {
        q: 'Magnesium sulfate is specifically indicated for which pediatric rhythm?',
        options: ['Asystole', 'Torsades de pointes', 'Atrial fibrillation', 'Sinus bradycardia'],
        answer: 1,
      },
      {
        q: 'What is the pediatric magnesium dose range for torsades?',
        options: ['0.5–1 mg/kg', '25–50 mg/kg (max 2 g)', '100 mg/kg', '1 g/kg'],
        answer: 1,
      },
      {
        q: 'Torsades de pointes is associated with what ECG finding?',
        options: ['Short PR interval', 'Prolonged QT interval', 'Delta wave', 'ST depression only'],
        answer: 1,
      },
      {
        q: 'Which is a risk of giving magnesium too rapidly?',
        options: ['Hypertension', 'Tachycardia', 'Hypotension and bradycardia', 'Hyperreflexia'],
        answer: 2,
      },
    ],
  },

  'Sodium Bicarb': {
    name: 'Sodium Bicarbonate',
    accent: 'amber',
    tagline: 'Buffer — specific pediatric arrest circumstances',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Alkalinizing buffer that neutralizes metabolic acid.',
          'Shifts potassium back into cells (helps hyperkalemia).',
          'Enhances protein binding of tricyclic antidepressants.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Known pre-existing metabolic acidosis or hyperkalemia.',
          'Tricyclic antidepressant or other sodium-channel-blocker overdose.',
          'Not recommended for routine use in pediatric cardiac arrest.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          '1 mEq/kg IV/IO initial dose, diluted appropriately for the patient\'s size.',
          'Guide further dosing with blood gas / bicarbonate levels when available.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Inactivates catecholamines (epinephrine) and precipitates calcium — flush the line.',
          'Can cause metabolic alkalosis, hypernatremia, and hyperosmolality.',
          'Does not replace adequate ventilation for clearing CO₂.',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the typical initial pediatric dose of sodium bicarbonate?',
        options: ['0.1 mEq/kg', '1 mEq/kg', '10 mEq/kg', '1 mg/kg'],
        answer: 1,
      },
      {
        q: 'Sodium bicarbonate is specifically indicated in which pediatric situation?',
        options: ['Routine cardiac arrest', 'Known hyperkalemia or TCA overdose', 'Torsades de pointes', 'Stable SVT'],
        answer: 1,
      },
      {
        q: 'Why should sodium bicarbonate not share a line with epinephrine or calcium?',
        options: ['It is too viscous', 'It inactivates catecholamines and precipitates calcium', 'It is light-sensitive', 'It causes clotting'],
        answer: 1,
      },
      {
        q: 'Sodium bicarbonate for routine pediatric cardiac arrest is:',
        options: ['Strongly recommended', 'Not recommended', 'First-line', 'Required before epinephrine'],
        answer: 1,
      },
    ],
  },

  Dopamine: {
    name: 'Dopamine',
    accent: 'red',
    tagline: 'Vasopressor / inotrope — pediatric bradycardia & shock',
    sections: [
      {
        heading: 'Class & Action',
        points: [
          'Catecholamine with dose-dependent receptor effects.',
          'Moderate doses (β-1) increase heart rate and contractility.',
          'Higher doses (α-1) cause vasoconstriction and raise blood pressure.',
        ],
      },
      {
        heading: 'Indications',
        points: [
          'Symptomatic bradycardia unresponsive to oxygenation/ventilation/epinephrine.',
          'Fluid-refractory shock after return of spontaneous circulation.',
        ],
      },
      {
        heading: 'Dose',
        points: [
          'Infusion: 2–20 mcg/kg/min, titrated to response.',
          'Titrate to target heart rate, perfusion, and blood pressure for age.',
          'Administer via infusion pump, ideally through a central or reliable IO/IV line.',
        ],
      },
      {
        heading: 'Cautions',
        points: [
          'Can cause tachyarrhythmias and increased myocardial oxygen demand.',
          'Correct hypovolemia with fluid boluses before starting.',
          'Extravasation causes tissue necrosis (α-mediated vasoconstriction).',
        ],
      },
    ],
    quiz: [
      {
        q: 'What is the usual pediatric dopamine infusion range?',
        options: ['0.1–0.5 mcg/kg/min', '2–20 mcg/kg/min', '1 mg/kg bolus', '50 mcg/kg/min flat'],
        answer: 1,
      },
      {
        q: 'Dopamine is considered for pediatric bradycardia when what has already been tried?',
        options: ['Oxygenation/ventilation and epinephrine', 'Nothing — it is always first-line', 'Only adenosine', 'Only magnesium'],
        answer: 0,
      },
      {
        q: 'At higher infusion rates, dopamine primarily acts on which receptors to raise BP?',
        options: ['α-1 (vasoconstriction)', 'Muscarinic', 'β-2 (bronchodilation)', 'Sodium channels'],
        answer: 0,
      },
      {
        q: 'What should be corrected before starting a dopamine infusion for shock?',
        options: ['Hypovolemia (give fluid boluses)', 'Hypercarbia', 'Hyperglycemia', 'Fever'],
        answer: 0,
      },
    ],
  },
}

// Look up the review entry for a given med "drug" string from MedLogPanel.
// mode 'PALS' returns the pediatric entry (falling back to the adult one if
// a pediatric version doesn't exist for that drug).
export function getMedication(drug, mode = 'ACLS') {
  if (mode === 'PALS') return PEDIATRIC_MEDICATIONS[drug] || MEDICATIONS[drug] || null
  return MEDICATIONS[drug] || null
}

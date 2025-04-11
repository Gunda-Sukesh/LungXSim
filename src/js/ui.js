import { initThreeJS, loadDrugModel } from './threeApp.js';

const drugData = {
    albuterol: {
        name: "Albuterol (Ventolin)",
        type: "Bronchodilator (Inhaler)",
        dosage: "90 mcg (1–2 puffs)",
        lungEffect: "Red fades to pink",
        breathingEffect: "Normalizes (reduces shortness of breath)",
        breathingMultiplier: "1.2x (Slightly faster breathing)",
        overdose: "Tremors, increased HR, anxiety"
    },
    budesonide: {
        name: "Budesonide (Pulmicort)",
        type: "Corticosteroid (Inhaler)",
        dosage: "200–800 mcg/day",
        lungEffect: "Gradual redness reduction",
        breathingEffect: "Stabilizes over time",
        breathingMultiplier: "1.0x (No major change)",
        overdose: "Suppresses immunity, risk of lung infections"
    },
    prednisone: {
        name: "Prednisone",
        type: "Corticosteroid (Oral)",
        dosage: "5–60 mg/day",
        lungEffect: "Inflamed areas turn pink over days",
        breathingEffect: "Gradual improvement",
        breathingMultiplier: "0.95x (Slight slowing of breathing)",
        overdose: "High blood sugar, adrenal suppression"
    },
    epinephrine: {
        name: "Epinephrine (EpiPen)",
        type: "Adrenergic Agonist (Injection)",
        dosage: "0.3 mg IM",
        lungEffect: "Lungs turn pale (vasoconstriction)",
        breathingEffect: "Rapid breathing increase",
        breathingMultiplier: "1.5x (Faster breathing)",
        overdose: "Severe hypertension, heart attack risk"
    },
    morphine: {
        name: "Morphine",
        type: "Opioid (IV)",
        dosage: "2.5–10 mg IV",
        lungEffect: "Bluish tint (oxygen intake reduction)",
        breathingEffect: "Slows breathing significantly",
        breathingMultiplier: "0.5x (Respiratory depression)",
        overdose: "Breathing may stop (Overdose fatal)"
    },
    cisplatin: {
        name: "Cisplatin",
        type: "Chemotherapy (IV)",
        dosage: "50–100 mg/m² IV",
        lungEffect: "Patchy discoloration (fibrosis)",
        breathingEffect: "Breathing decreases",
        breathingMultiplier: "0.8x (Mild suppression)",
        overdose: "Permanent lung damage, severe toxicity"
    },
    isoniazid: {
        name: "Isoniazid",
        type: "Antibiotic (Oral, TB Treatment)",
        dosage: "300 mg/day",
        lungEffect: "Darkening in lung spots (temporary)",
        breathingEffect: "Breathing fluctuates",
        breathingMultiplier: "0.9x (Mild suppression)",
        overdose: "Liver toxicity, seizures"
    },
    saline: {
        name: "Saline Nebulization",
        type: "Hydration Therapy (Nebulizer)",
        dosage: "3-5 ml (inhaled)",
        lungEffect: "Lungs turn vibrant pink (moisture effect)",
        breathingEffect: "Stabilizes breathing",
        breathingMultiplier: "1.0x (No change)",
        overdose: "No significant overdose effects"
    },
    nicotine: {
        name: "Nicotine (Cigarette/Vape)",
        type: "Stimulant (Inhaled)",
        dosage: "~1 mg per puff",
        lungEffect: "Reddish inflammation (irritation)",
        breathingEffect: "Short-term increase, then suppression",
        breathingMultiplier: "1.3x → 0.7x (Initial spike, later slowing)",
        overdose: "Lung cancer risk, chronic bronchitis"
    },
    antihistamines: {
        name: "Antihistamines (Diphenhydramine)",
        type: "Allergy Treatment (Oral)",
        dosage: "25-50 mg",
        lungEffect: "No major color change",
        breathingEffect: "Mildly slows breathing",
        breathingMultiplier: "0.9x",
        overdose: "Drowsiness, hallucinations"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    setupDrugSelector();
});

function setupDrugSelector() {
    const drugSelector = document.getElementById('drug-selector');
    const drugInfo = document.getElementById('drug-info');

    if (!drugSelector || !drugInfo) {
        console.error('Required DOM elements not found');
        return;
    }

    drugSelector.addEventListener('change', (e) => {
        const selectedDrug = e.target.value;

        if (selectedDrug && drugData[selectedDrug]) {
            loadDrugModel(selectedDrug);
            const data = drugData[selectedDrug];
            updateDrugInfo(data);
            drugInfo.style.display = 'block';
        } else {
            drugInfo.style.display = 'none';
        }
    });
}

function updateDrugInfo(data) {
    const elements = {
        'drug-name': data.name,
        'drug-type': data.type,
        'drug-dosage': data.dosage,
        'drug-lung-effect': data.lungEffect,
        'drug-breathing-effect': `${data.breathingEffect} (${data.breathingMultiplier})`,
        'drug-overdose': data.overdose
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}
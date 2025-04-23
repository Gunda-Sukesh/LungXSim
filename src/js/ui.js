import { initThreeJS, loadDrugModel } from './threeApp.js';

const drugData = {
    albuterol: {
        name: "Albuterol (Ventolin)",
        type: "Bronchodilator (Inhaler)",
        dosageLevels: [
            { level: "Standard (90 mcg)", value: 1.0 },
            { level: "Pediatric (45 mcg)", value: 0.5 },
            { level: "Severe (180 mcg)", value: 1.5 }
        ],
        lungEffect: "Bronchodilation (spotted pink, fades after 15s)",
        breathingEffect: "Increased airflow",
        overdose: "Tachycardia, tremors"
    },
    budesonide: {
        name: "Budesonide (Pulmicort)",
        type: "Corticosteroid (Inhaler)",
        dosageLevels: [
            { level: "Mild (200 mcg)", value: 0.7 },
            { level: "Moderate (400 mcg)", value: 1.0 },
            { level: "Severe (800 mcg)", value: 1.3 }
        ],
        lungEffect: "Reduces inflammation (spotted peach, fades after 15s)",
        breathingEffect: "Gradual improvement",
        overdose: "Oral thrush, adrenal suppression"
    },
    prednisone: {
        name: "Prednisone",
        type: "Corticosteroid (Oral)",
        dosageLevels: [
            { level: "Low (5-10 mg)", value: 0.5 },
            { level: "Medium (20-40 mg)", value: 1.0 },
            { level: "High (60 mg)", value: 1.5 }
        ],
        lungEffect: "Systemic anti-inflammatory (spotted coral, fades after 15s)",
        breathingEffect: "Stable breathing",
        overdose: "Hyperglycemia, osteoporosis"
    },
    epinephrine: {
        name: "Epinephrine (EpiPen)",
        type: "Adrenergic Agonist (Injection)",
        dosageLevels: [
            { level: "Child (0.15 mg)", value: 0.7 },
            { level: "Adult (0.3 mg)", value: 1.0 },
            { level: "Severe (0.5 mg)", value: 1.3 }
        ],
        lungEffect: "Rapid bronchodilation (spotted purple, fades after 15s)",
        breathingEffect: "Rapid improvement",
        overdose: "Hypertensive crisis"
    },
    morphine: {
        name: "Morphine",
        type: "Opioid (IV)",
        dosageLevels: [
            { level: "Mild (2 mg)", value: 0.5 },
            { level: "Moderate (5 mg)", value: 1.0 },
            { level: "Severe (10 mg)", value: 1.5 }
        ],
        lungEffect: "Respiratory depression (spotted blue, fades after 15s)",
        breathingEffect: "Slowed breathing",
        overdose: "Respiratory arrest"
    },
    cisplatin: {
        name: "Cisplatin",
        type: "Chemotherapy (IV)",
        dosageLevels: [
            { level: "Low (50 mg/m²)", value: 0.7 },
            { level: "Medium (75 mg/m²)", value: 1.0 },
            { level: "High (100 mg/m²)", value: 1.3 }
        ],
        lungEffect: "Potential toxicity (spotted gray/red, fades after 15s)",
        breathingEffect: "Possible fibrosis",
        overdose: "Nephrotoxicity"
    },
    isoniazid: {
        name: "Isoniazid",
        type: "Antibiotic (Oral)",
        dosageLevels: [
            { level: "Prophylaxis (300 mg)", value: 0.8 },
            { level: "Treatment (5 mg/kg)", value: 1.0 },
            { level: "MDR-TB (high dose)", value: 1.2 }
        ],
        lungEffect: "Anti-tubercular (spotted brown, fades after 15s)",
        breathingEffect: "Gradual improvement",
        overdose: "Hepatotoxicity"
    },
    saline: {
        name: "Saline Nebulization",
        type: "Hydration Therapy",
        dosageLevels: [
            { level: "Standard (3 ml)", value: 1.0 },
            { level: "Extended (5 ml)", value: 1.2 },
            { level: "Continuous", value: 1.5 }
        ],
        lungEffect: "Moistens airways (spotted light blue, fades after 15s)",
        breathingEffect: "No significant change",
        overdose: "None"
    },
    nicotine: {
        name: "Nicotine",
        type: "Stimulant",
        dosageLevels: [
            { level: "Light (1 cigarette)", value: 0.8 },
            { level: "Moderate (1 pack)", value: 1.0 },
            { level: "Heavy (2+ packs)", value: 1.3 }
        ],
        lungEffect: "Vasoconstriction (spotted red, fades after 15s)",
        breathingEffect: "Short-term stimulation",
        overdose: "Tachycardia"
    },
    antihistamines: {
        name: "Antihistamines",
        type: "H1-blocker",
        dosageLevels: [
            { level: "Standard (25 mg)", value: 0.8 },
            { level: "Strong (50 mg)", value: 1.0 },
            { level: "Sedating (75+ mg)", value: 1.2 }
        ],
        lungEffect: "Reduces inflammation (spotted pale pink, fades after 15s)",
        breathingEffect: "Mild sedation",
        overdose: "Drowsiness"
    }
};

let progressBarIntervalId = null; // Keep track of the interval timer

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    setupDrugSelector();

    // Listen for the custom event from threeApp.js
    document.addEventListener('effectDurationCalculated', (event) => {
        const progressBarContainer = document.getElementById('effect-progress-container');
        const progressBar = document.getElementById('effect-progress-bar');
        const duration = event.detail.duration;

        if (progressBarContainer && progressBar && duration > 0) {
            // Clear any previous animation just in case
            if (progressBarIntervalId) {
                clearInterval(progressBarIntervalId);
                progressBarIntervalId = null;
            }
            // Show and start the progress bar with the received duration
            progressBarContainer.style.display = 'block';
            progressBar.style.width = '0%'; // Reset width
            startProgressBar(duration, progressBar);
        }
    });
});

function setupDrugSelector() {
    const drugSelector = document.getElementById('drug-selector');
    const dosageSelector = document.getElementById('dosage-selector');
    const drugInfo = document.getElementById('drug-info');
    const progressBarContainer = document.getElementById('effect-progress-container');
    const progressBar = document.getElementById('effect-progress-bar');

    if (!drugSelector || !dosageSelector || !drugInfo || !progressBarContainer || !progressBar) {
        console.error('Required DOM elements not found');
        return;
    }

    drugSelector.innerHTML = '<option value="">Select a drug</option>';
    Object.keys(drugData).forEach(drugKey => {
        const option = document.createElement('option');
        option.value = drugKey;
        option.textContent = drugData[drugKey].name;
        drugSelector.appendChild(option);
    });

    drugSelector.addEventListener('change', (e) => {
        const selectedDrug = e.target.value;

        updateDosageOptions(selectedDrug);

        // Clear previous progress bar animation immediately on selection change
        if (progressBarIntervalId) {
            clearInterval(progressBarIntervalId);
            progressBarIntervalId = null;
        }
        // Reset and hide progress bar until new duration is received
        progressBar.style.width = '0%';
        progressBarContainer.style.display = 'none';

        if (selectedDrug && drugData[selectedDrug]) {
            const defaultDosage = drugData[selectedDrug].dosageLevels[0].value;
            loadDrugModel(selectedDrug, defaultDosage); // This will trigger the event later
            updateDrugInfo(drugData[selectedDrug], defaultDosage);
            drugInfo.style.display = 'block';
            // Progress bar is now started by the 'effectDurationCalculated' event listener

        } else {
            drugInfo.style.display = 'none';
            // Ensure progress bar is hidden if no drug is selected
            progressBarContainer.style.display = 'none';
        }
    });

    dosageSelector.addEventListener('change', (e) => {
        const selectedDrug = drugSelector.value;
        const dosageValue = parseFloat(e.target.value);

        // Clear previous progress bar animation immediately on dosage change
        if (progressBarIntervalId) {
            clearInterval(progressBarIntervalId);
            progressBarIntervalId = null;
        }
        // Reset and hide progress bar until new duration is received
        progressBar.style.width = '0%';
        progressBarContainer.style.display = 'none';

        if (selectedDrug && drugData[selectedDrug]) {
            loadDrugModel(selectedDrug, dosageValue); // This will trigger the event later
            updateDrugInfo(drugData[selectedDrug], dosageValue);
            // Progress bar is now started by the 'effectDurationCalculated' event listener
        }
    });
}

function updateDosageOptions(drugKey) {
    const dosageSelector = document.getElementById('dosage-selector');
    dosageSelector.innerHTML = '';

    if (drugKey && drugData[drugKey]) {
        drugData[drugKey].dosageLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.value;
            option.textContent = level.level;
            dosageSelector.appendChild(option);
        });
        dosageSelector.disabled = false;
    } else {
        dosageSelector.disabled = true;
    }
}

function updateDrugInfo(data, dosageValue) {
    const elements = {
        'drug-name': data.name,
        'drug-type': data.type,
        'drug-dosage': `Current: ${data.dosageLevels.find(d => d.value === dosageValue)?.level || ''}`,
        'drug-lung-effect': data.lungEffect,
        'drug-breathing-effect': data.breathingEffect,
        'drug-overdose': data.overdose
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Function to linearly interpolate between two numbers
function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

// Function to interpolate between two RGB colors
function interpolateColor(color1, color2, factor) {
    const r = Math.round(lerp(color1.r, color2.r, factor));
    const g = Math.round(lerp(color1.g, color2.g, factor));
    const b = Math.round(lerp(color1.b, color2.b, factor));
    return `rgb(${r}, ${g}, ${b})`;
}

// Function to animate the progress bar with gradient color
function startProgressBar(duration, progressBarElement) {
    const startTime = Date.now();

    // Define colors for the gradient effect (RGB 0-255)
    const startColor = { r: 160, g: 196, b: 255 }; // Light Blue (#a0c4ff)
    const peakColor = { r: 52, g: 152, b: 219 };  // Theme Secondary Blue (#3498db)
    // End color will be the same as startColor

    // Clear any existing interval
    if (progressBarIntervalId) {
        clearInterval(progressBarIntervalId);
        progressBarIntervalId = null;
    }

    progressBarIntervalId = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const overallProgress = Math.min(1, elapsedTime / duration); // Progress from 0 to 1

        // Update width
        progressBarElement.style.width = overallProgress * 100 + '%';

        // Calculate color based on progress phase
        let currentColor;
        const peakTime = 0.5; // Assume peak effect is halfway through the total duration

        if (overallProgress <= peakTime) {
            // Phase 1: Applying effect (Start -> Peak)
            const phaseProgress = overallProgress / peakTime; // Scale 0 -> 0.5 to 0 -> 1
            currentColor = interpolateColor(startColor, peakColor, phaseProgress);
        } else {
            // Phase 2: Reverting effect (Peak -> Start)
            const phaseProgress = (overallProgress - peakTime) / (1 - peakTime); // Scale 0.5 -> 1 to 0 -> 1
            currentColor = interpolateColor(peakColor, startColor, phaseProgress);
        }

        // Apply the calculated color
        progressBarElement.style.backgroundColor = currentColor;

        // Stop when duration is reached
        if (overallProgress >= 1) {
            clearInterval(progressBarIntervalId);
            progressBarIntervalId = null;
            // Optionally reset to a final state or hide
             progressBarElement.style.backgroundColor = `rgb(${startColor.r}, ${startColor.g}, ${startColor.b})`; // Ensure final color is set
            // setTimeout(() => {
            //     document.getElementById('effect-progress-container').style.display = 'none';
            // }, 1000); 
        }
    }, 30); // Update slightly more frequently for smoother color transition
}
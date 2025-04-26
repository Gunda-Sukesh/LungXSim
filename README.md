# Drug Effect Visualization with Three.js

## Overview
This project visualizes the effects of various drugs on a 3D model of human lungs using Three.js. The simulation demonstrates how different medications (like albuterol, morphine, nicotine, etc.) might affect lung tissue through dynamic color changes and breathing pattern modifications.

## Features
- 🎭 Interactive 3D lung model visualization
- 💊 Simulates effects of 10+ different drugs
- 🎨 Dynamic color spreading algorithm (bacterial spread pattern)
- 🌬️ Adjustable breathing animation based on drug type/dosage
- 📊 Dosage-sensitive visual effects (low/medium/high)
- 🔄 Reset functionality to clear drug effects

## Supported Drugs
| Drug Name       | Visual Effect                          | Breathing Effect               |
|-----------------|----------------------------------------|---------------------------------|
| Albuterol       | Bright pink spreading                  | Increased breathing rate        |
| Budesonide      | Peach-colored spreading                | Slightly increased breathing    |
| Prednisone      | Coral-colored spreading                | Normal breathing                |
| Epinephrine     | Purple spreading                       | Rapid breathing                 |
| Morphine        | Blue spreading                         | Slowed breathing                |
| Cisplatin       | Gray/red spreading                     | Slightly slowed breathing       |
| Isoniazid       | Brown spreading                        | Normal breathing                |
| Saline          | Light blue spreading                   | No breathing change             |
| Nicotine        | Red spreading                          | Initial increase then decrease  |
| Antihistamines  | Pale pink spreading                    | Slightly slowed breathing       |

## Cloning 
```bash
https://github.com/Gunda-Sukesh/LungXSim.git
```
## Installing Dependencies
```bash
cd drug-visualization
npm install
```
## Running the project
```bash
npm run dev
```
## Vercel Deployment
https://lung-sim-x.vercel.app/

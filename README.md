# 🚀 Advanced Rocket Engine Regenerative Cooling Simulator

A comprehensive computational fluid dynamics (CFD) and thermal analysis simulator for rocket engine regenerative cooling systems. Features 18 hardcore physics modules with real-time visualization and cross-engine validation.



## 📋 Overview

This simulator provides detailed analysis of rocket engine cooling systems using advanced physics models. Built with React and modern web technologies, it simulates real rocket engines (Raptor 2, Merlin 1D, RS-25) with accurate thermal, structural, and performance characteristics.

## ✨ Key Features

### **18 Hardcore Physics Modules**

**Thermal & Flow Analysis:**
- 🔥 Regenerative Cooling Simulation
- 🌡️ Conjugate Heat Transfer (Solid-Fluid Coupling)
- 💧 Two-Phase Flow Analysis (Boiling, CHF, DNB)
- 🌊 Boundary Layer Analysis (Laminar & Turbulent)
- ☀️ Radiation Heat Transfer (View Factors)

**Combustion & Injection:**
- 💉 Injector Atomization (SMD, Weber Number)
- 🔬 Chemical Kinetics & Combustion
- 🛡️ Film Cooling Effectiveness

**Structural & Vibration:**
- 💪 Material Stress Analysis
- 📊 Fatigue & Creep Life Prediction
- 🌊 Structural Vibration & Modal Analysis
- 🔥 Erosion & Ablation Analysis

**Performance Optimization:**
- 🚀 Nozzle Shape Optimization (Method of Characteristics)
- 📐 Compressible Flow Analysis
- 🎯 Thrust Vector Control (TVC)
- 🔊 Acoustic Analysis

**Advanced Models:**
- 🌀 Turbulence Modeling (k-ε)
- ⏱️ Transient Thermal Solver

### **Real Rocket Engines**
- **Raptor 2** (SpaceX): Full-flow staged combustion, 300 bar, methalox
- **Merlin 1D** (SpaceX): Gas-generator cycle, 97 bar, RP-1/LOX
- **RS-25** (NASA): Staged combustion, 204 bar, LH2/LOX

## 🛠️ Tech Stack

- **Frontend:** React 18.2, Vite
- **Visualization:** Recharts, Three.js
- **State Management:** Zustand
- **Mathematics:** MathJS
- **Styling:** CSS3, Custom themes

## 📸 Screenshots
<img width="1053" height="926" alt="Image" src="https://github.com/user-attachments/assets/1de5ec74-cd5e-4376-931f-5e3f9f63103a" />

<img width="887" height="974" alt="Image" src="https://github.com/user-attachments/assets/28538c65-c607-44af-8a6a-b355e82c590e" />

<img width="1024" height="919" alt="Image" src="https://github.com/user-attachments/assets/7c6bb853-114a-4ae2-b47e-41376f21651f" />

<img width="955" height="793" alt="Image" src="https://github.com/user-attachments/assets/54899691-b7a0-406d-aa89-779c5e623dc3" />

<img width="1031" height="952" alt="Image" src="https://github.com/user-attachments/assets/0f9b4e78-6bda-4901-8a47-c167ddd63615" />

<img width="358" height="694" alt="Image" src="https://github.com/user-attachments/assets/f20dc2ba-89f7-469c-8100-cdb996073b36" />

<img width="389" height="713" alt="Image" src="https://github.com/user-attachments/assets/a7195ed7-6434-4341-a68e-72349f708bf3" />


## 🚀 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/regenerative-cooling-simulator.git

# Navigate to project directory
cd regenerative-cooling-simulator

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`

## 💻 Usage

1. **Select Engine Preset:**
   - Choose from Raptor 2, Merlin 1D, or RS-25
   - Each has realistic geometry and operating parameters

2. **Adjust Parameters (Optional):**
   - Chamber Temperature
   - Chamber Pressure
   - Mass Flow Rate
   - Coolant Inlet Temperature

3. **Run Simulation:**
   - Click "Run Simulation"
   - Wait for thermal solver to complete (~2-3 seconds)

4. **Explore Results:**
   - Scroll through 18 physics analysis panels
   - Interactive charts and visualizations
   - Detailed performance metrics

## 📊 Physics Modules Details

### Thermal Analysis
- **Peak Heat Flux:** Up to 50+ MW/m² at throat
- **Wall Temperature:** Regenerative cooling maintains 400-700K
- **Coolant Temperature Rise:** Tracks heating through channels

### Two-Phase Flow
- **CHF Analysis:** Critical Heat Flux safety margins
- **Boiling Detection:** ONB (Onset Nucleate Boiling)
- **Void Fraction:** Drift-flux model
- **Flow Regimes:** Single-phase, bubbly, slug, annular

### Injector Design
- **SMD Calculation:** Sauter Mean Diameter for droplets
- **Weber Number:** 10⁵ - 10⁶ range (full atomization)
- **Mixing Efficiency:** 85-90% typical

### Film Cooling
- **Effectiveness:** 20-40% with optimal blowing ratio
- **Blowing Ratio:** M = 0.5-1.0 optimal
- **Heat Flux Reduction:** 20-30%

### Nozzle Optimization
- **Thrust Coefficient:** C_F = 1.8-2.2
- **Specific Impulse:** 330-380 seconds
- **Bell Contour:** 80% length optimization
- **Exit Angle:** 12-15° for minimal divergence loss

## 📁 Project Structure
regenerative-cooling-simulator/
├── src/
│   ├── physics/              # 18 physics modules
│   │   ├── thermal.js
│   │   ├── twoPhaseFlow.js
│   │   ├── injectorAtomization.js
│   │   ├── filmCooling.js
│   │   ├── nozzleOptimization.js
│   │   └── ...
│   ├── components/           # 18 React panels
│   │   ├── ThermalResultsPanel.jsx
│   │   ├── TwoPhaseFlowPanel.jsx
│   │   ├── InjectorPanel.jsx
│   │   └── ...
│   ├── App.jsx              # Main application
│   └── main.jsx
├── screenshots/             # Documentation images
├── README.md
└── package.json

## 🔬 Scientific Accuracy

All physics models are based on established aerospace engineering correlations:

- **Two-Phase Flow:** Chen correlation, Bowring CHF, Drift-flux model
- **Turbulence:** k-ε model with wall functions
- **Heat Transfer:** Dittus-Boelter, radiation view factors
- **Nozzle:** Method of Characteristics (Rao), isentropic flow
- **Vibration:** Cantilever beam modal analysis
- **Erosion:** Finnie model, Arrhenius kinetics

## 🎯 Validation

Cross-validated against multiple engines showing physically realistic variations:

- **Raptor 2 vs Merlin 1D:** Higher pressure → higher CHF margin ✓
- **Film Cooling:** Density ratio effects correct ✓
- **TVC:** Thrust-proportional control torque ✓
- **Nozzle:** Temperature-dependent I_sp ✓

## 📚 Key Equations

### Regenerative Cooling
q = h_gas(T_gas - T_wall) = h_coolant(T_wall - T_coolant)
### Two-Phase CHF
q_CHF = (A + B·x_e) · G · h_fg

### Thrust Coefficient
C_F = sqrt(2γ²/(γ-1) · (2/(γ+1))^((γ+1)/(γ-1)) · [1-(P_e/P_c)^((γ-1)/γ)])

### Specific Impulse
I_sp = C_F · c* / g_0

## 🏗️ Future Enhancements

- [ ] 3D nozzle visualization
- [ ] Real-time parameter sliders
- [ ] Export results to PDF/CSV
- [ ] Animation system (time evolution)
- [ ] Custom engine designer
- [ ] Mobile responsive design

## 📜 License

MIT License - feel free to use for educational and research purposes.

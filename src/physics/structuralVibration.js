/**
 * STRUCTURAL VIBRATION & MODAL ANALYSIS
 * Natural frequencies, mode shapes, resonance assessment
 */

/**
 * NATURAL FREQUENCY - Simple Cantilever Beam Model
 * Engine approximated as cantilever beam (fixed at gimbal, free at nozzle)
 * 
 * f_n = (λ_n² / 2π) * sqrt(EI / (m*L⁴))
 * 
 * Where:
 * - λ_n = eigenvalue (1.875, 4.694, 7.855 for modes 1,2,3)
 * - E = Young's modulus
 * - I = moment of inertia
 * - m = mass per unit length
 * - L = length
 */
export function naturalFrequency(params) {
  const {
    E,              // Young's modulus [Pa]
    I,              // Moment of inertia [m⁴]
    m,              // Mass per unit length [kg/m]
    L,              // Length [m]
    mode,           // Mode number (1, 2, 3, ...)
  } = params;
  
  // Eigenvalues for cantilever beam modes
  const eigenvalues = [1.875, 4.694, 7.855, 10.996, 14.137];
  const lambda = eigenvalues[mode - 1] || eigenvalues[0];
  
  const f_n = (lambda * lambda / (2 * Math.PI)) * Math.sqrt((E * I) / (m * L * L * L * L));
  
  return f_n;
}

/**
 * MODE SHAPE AMPLITUDE
 * Relative displacement along beam for a given mode
 * 
 * w(x) = A * [cosh(λx/L) - cos(λx/L) - σ(sinh(λx/L) - sin(λx/L))]
 */
export function modeShape(x, L, mode) {
  const eigenvalues = [1.875, 4.694, 7.855];
  const lambda = eigenvalues[mode - 1] || eigenvalues[0];
  
  // Frequency ratio
  const sigma_values = [0.734, 1.018, 0.999];
  const sigma = sigma_values[mode - 1] || sigma_values[0];
  
  const xi = x / L;
  const lx = lambda * xi;
  
  const w = Math.cosh(lx) - Math.cos(lx) - sigma * (Math.sinh(lx) - Math.sin(lx));
  
  return w;
}

/**
 * DAMPING RATIO
 * Typical values for rocket structures
 * 
 * ζ = c / (2 * sqrt(k*m))
 */
export function dampingRatio(material = 'steel') {
  // Typical damping ratios
  const ratios = {
    'steel': 0.01,      // 1% (low damping)
    'aluminum': 0.015,  // 1.5%
    'composite': 0.02,  // 2%
    'welded': 0.005,    // 0.5% (very low)
  };
  
  return ratios[material] || 0.01;
}

/**
 * RESONANCE CHECK
 * Check if excitation frequency is near natural frequency
 * 
 * Resonance occurs when: |f_excite - f_natural| < Δf
 */
export function resonanceRisk(f_excite, f_natural, zeta) {
  // Bandwidth around natural frequency (dangerous zone)
  const delta_f = f_natural * zeta * 2; // ±2ζ bandwidth
  
  const distance = Math.abs(f_excite - f_natural);
  
  if (distance < delta_f) {
    return {
      risk: 'high',
      margin: (distance / delta_f) * 100,
    };
  } else if (distance < delta_f * 2) {
    return {
      risk: 'moderate',
      margin: (distance / delta_f) * 100,
    };
  } else {
    return {
      risk: 'low',
      margin: (distance / delta_f) * 100,
    };
  }
}

/**
 * AMPLIFICATION FACTOR
 * Dynamic response amplification at resonance
 * 
 * A = 1 / (2*ζ)
 * 
 * Lower damping → higher amplification
 */
export function amplificationFactor(zeta) {
  return 1 / (2 * zeta);
}

/**
 * VIBRATION STRESS
 * Stress induced by vibration
 * 
 * σ = E * ε = E * (d²w/dx²) * y
 */
export function vibrationStress(params) {
  const {
    E,              // Young's modulus
    amplitude,      // Vibration amplitude [m]
    L,              // Length [m]
    y,              // Distance from neutral axis [m]
  } = params;
  
  // Simplified: σ ≈ E * amplitude * y / L²
  const sigma = E * amplitude * y / (L * L);
  
  return sigma;
}

/**
 * EXCITATION SOURCES
 * Identify vibration sources in rocket engine
 */
export function excitationSources(params) {
  const {
    combustionFreq,     // Combustion instability frequency
    pumpFreq,           // Turbopump rotation frequency
    flowFreq,           // Vortex shedding frequency
  } = params;
  
  return {
    combustion: combustionFreq,
    pump: pumpFreq,
    flow: flowFreq,
  };
}

/**
 * CAMPBELL DIAGRAM DATA
 * Speed vs frequency for rotating machinery
 * 
 * f_pump = N / 60  [Hz]
 * Where N = RPM
 */
export function campbellData(RPM_range, harmonics = [1, 2, 3]) {
  const data = [];
  
  for (const RPM of RPM_range) {
    const f_base = RPM / 60; // Hz
    
    const point = { RPM: RPM };
    harmonics.forEach((h, idx) => {
      point[`harmonic_${h}`] = f_base * h;
    });
    
    data.push(point);
  }
  
  return data;
}

/**
 * FATIGUE DAMAGE FROM VIBRATION
 * Palmgren-Miner rule for cyclic loading
 * 
 * D = Σ(n_i / N_i)
 */
export function vibrationFatigue(params) {
  const {
    stress_amplitude,   // Stress amplitude [Pa]
    frequency,          // Frequency [Hz]
    duration,           // Duration [s]
    S_f,                // Fatigue strength [Pa]
    b,                  // Fatigue exponent
  } = params;
  
  // Number of cycles
  const n = frequency * duration;
  
  // Cycles to failure (S-N curve)
  const N = Math.pow(S_f / stress_amplitude, 1 / b);
  
  // Damage
  const D = n / N;
  
  return {
    cycles: n,
    cycles_to_failure: N,
    damage: D,
  };
}

/**
 * TRANSMISSIBILITY
 * Vibration transmission from base to mass
 * 
 * T = sqrt(1 + (2ζr)²) / sqrt((1-r²)² + (2ζr)²)
 * 
 * Where r = f/f_n (frequency ratio)
 */
export function transmissibility(f, f_n, zeta) {
  const r = f / f_n;
  
  const numerator = Math.sqrt(1 + Math.pow(2 * zeta * r, 2));
  const denominator = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
  
  const T = numerator / denominator;
  
  return T;
}

/**
 * COMPLETE STRUCTURAL VIBRATION ANALYZER
 */
export class StructuralVibrationAnalyzer {
  constructor(params) {
    this.L = params.L || 2.0;                    // Engine length [m]
    this.D_outer = params.D_outer || 0.5;        // Outer diameter [m]
    this.t_wall = params.t_wall || 0.005;        // Wall thickness [m]
    this.rho_material = params.rho_material || 7850; // Steel density [kg/m³]
    this.E = params.E || 200e9;                  // Young's modulus [Pa]
    this.material = params.material || 'steel';
    this.pumpRPM = params.pumpRPM || 30000;      // Turbopump RPM
    
    this.analyze();
  }
  
  analyze() {
    // 1. Geometric properties
    const D_inner = this.D_outer - 2 * this.t_wall;
    const A = Math.PI * (this.D_outer * this.D_outer - D_inner * D_inner) / 4;
    
    // Moment of inertia (hollow cylinder)
    this.I = Math.PI * (Math.pow(this.D_outer, 4) - Math.pow(D_inner, 4)) / 64;
    
    // Mass per unit length
    this.m = this.rho_material * A;
    
    // Total mass
    this.mass_total = this.m * this.L;
    
    // 2. Natural frequencies (first 3 modes)
    this.modes = [];
    for (let mode = 1; mode <= 3; mode++) {
      const f_n = naturalFrequency({
        E: this.E,
        I: this.I,
        m: this.m,
        L: this.L,
        mode: mode,
      });
      
      this.modes.push({
        mode: mode,
        frequency: f_n,
        period: 1 / f_n,
      });
    }
    
    // 3. Damping ratio
    this.zeta = dampingRatio(this.material);
    
    // 4. Amplification factor
    this.Q = amplificationFactor(this.zeta);
    
    // 5. Excitation sources
    const f_pump = this.pumpRPM / 60; // Hz
    const f_combustion = 100; // Typical ~100 Hz for combustion instability
    const f_flow = 50; // Vortex shedding ~50 Hz
    
    this.excitations = {
      pump: f_pump,
      combustion: f_combustion,
      flow: f_flow,
    };
    
    // 6. Resonance checks
    this.resonanceChecks = [];
    Object.entries(this.excitations).forEach(([source, f_ex]) => {
      this.modes.forEach(mode => {
        const check = resonanceRisk(f_ex, mode.frequency, this.zeta);
        this.resonanceChecks.push({
          source: source,
          mode: mode.mode,
          f_excite: f_ex,
          f_natural: mode.frequency,
          risk: check.risk,
          margin: check.margin,
        });
      });
    });
    
    // 7. Mode shapes (sample points along length)
    this.modeShapes = [];
    const numPoints = 20;
    for (let mode = 1; mode <= 3; mode++) {
      const shape = [];
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * this.L;
        const w = modeShape(x, this.L, mode);
        shape.push({
          x: x,
          x_percent: (x / this.L) * 100,
          amplitude: w,
        });
      }
      this.modeShapes.push({
        mode: mode,
        shape: shape,
      });
    }
    
    // 8. Transmissibility at excitation frequencies
    this.transmissibility = [];
    Object.entries(this.excitations).forEach(([source, f_ex]) => {
      const T = transmissibility(f_ex, this.modes[0].frequency, this.zeta);
      this.transmissibility.push({
        source: source,
        f: f_ex,
        T: T,
      });
    });
    
    // 9. Find highest risk resonance
    let highestRisk = this.resonanceChecks[0];
    for (const check of this.resonanceChecks) {
      if (check.risk === 'high' && check.margin < highestRisk.margin) {
        highestRisk = check;
      }
    }
    this.criticalResonance = highestRisk;
  }
  
  getResults() {
    return {
      modes: this.modes,
      zeta: this.zeta,
      Q: this.Q,
      excitations: this.excitations,
      resonanceChecks: this.resonanceChecks,
      modeShapes: this.modeShapes,
      transmissibility: this.transmissibility,
      criticalResonance: this.criticalResonance,
      mass_total: this.mass_total,
      I: this.I,
    };
  }
}

export default {
  naturalFrequency,
  modeShape,
  dampingRatio,
  resonanceRisk,
  amplificationFactor,
  vibrationStress,
  excitationSources,
  campbellData,
  vibrationFatigue,
  transmissibility,
  StructuralVibrationAnalyzer,
};
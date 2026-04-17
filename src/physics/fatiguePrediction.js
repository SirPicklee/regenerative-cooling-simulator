/**
 * FATIGUE & CREEP LIFE PREDICTION
 * Low-cycle fatigue, thermal fatigue, creep damage analysis
 */

/**
 * COFFIN-MANSON EQUATION
 * Low-cycle fatigue life prediction
 * Δε/2 = ε'_f * (2N_f)^c
 * 
 * Where:
 * - Δε = total strain range
 * - N_f = cycles to failure
 * - ε'_f = fatigue ductility coefficient
 * - c = fatigue ductility exponent (typically -0.5 to -0.7)
 */
export function coffinMansonLife(strainRange, epsf_prime = 0.5, c = -0.6) {
  // N_f = (Δε / (2 * ε'_f))^(1/c) / 2
  const N_f = Math.pow(strainRange / (2 * epsf_prime), 1 / c) / 2;
  return Math.max(1, N_f);
}

/**
 * THERMAL STRAIN RANGE
 * Δε_thermal = α * ΔT
 * Where α is coefficient of thermal expansion
 */
export function thermalStrainRange(alpha, deltaT) {
  return alpha * deltaT;
}

/**
 * BASQUIN EQUATION
 * High-cycle fatigue (stress-based)
 * Δσ/2 = σ'_f * (2N_f)^b
 * 
 * Where:
 * - Δσ = stress range
 * - σ'_f = fatigue strength coefficient
 * - b = fatigue strength exponent (typically -0.1 to -0.15)
 */
export function basquinLife(stressRange, sigmaf_prime = 1000e6, b = -0.12) {
  const N_f = Math.pow(stressRange / (2 * sigmaf_prime), 1 / b) / 2;
  return Math.max(1, N_f);
}

/**
 * NORTON'S CREEP LAW
 * Steady-state creep rate
 * dε/dt = A * σ^n * exp(-Q / (R*T))
 * 
 * Where:
 * - A = material constant
 * - σ = applied stress
 * - n = stress exponent (typically 3-8 for metals)
 * - Q = activation energy
 * - R = gas constant
 * - T = temperature
 */
export function nortonCreepRate(stress, T, A = 1e-20, n = 5, Q = 300e3, R = 8.314) {
  const creepRate = A * Math.pow(stress, n) * Math.exp(-Q / (R * T));
  return creepRate;
}

/**
 * TIME TO RUPTURE (CREEP)
 * Simplified Larson-Miller parameter approach
 * LMP = T * (C + log(t_r))
 * 
 * Where:
 * - T = temperature [K]
 * - t_r = time to rupture [hours]
 * - C = material constant (typically 20 for metals)
 */
export function larsonMillerParameter(T, t_rupture_hours, C = 20) {
  return T * (C + Math.log10(t_rupture_hours));
}

/**
 * RUPTURE TIME FROM LMP
 */
export function ruptureTimeFromLMP(LMP, T, C = 20) {
  const log_t = LMP / T - C;
  return Math.pow(10, log_t); // hours
}

/**
 * MINER'S RULE
 * Cumulative damage for variable amplitude loading
 * D = Σ(n_i / N_i)
 * 
 * Where:
 * - n_i = number of cycles at stress level i
 * - N_i = cycles to failure at stress level i
 * - D ≥ 1.0 → failure
 */
export function minersRule(cycles, lives) {
  let damage = 0;
  for (let i = 0; i < cycles.length; i++) {
    damage += cycles[i] / lives[i];
  }
  return damage;
}

/**
 * GOODMAN CORRECTION
 * For mean stress effects on fatigue
 * σ_a / S_f + σ_m / S_u = 1
 * 
 * Where:
 * - σ_a = alternating stress amplitude
 * - σ_m = mean stress
 * - S_f = fatigue strength
 * - S_u = ultimate tensile strength
 */
export function goodmanCorrection(sigma_a, sigma_m, S_u) {
  const S_f_corrected = sigma_a / (1 - sigma_m / S_u);
  return S_f_corrected;
}

/**
 * MANSON-HAFERD PARAMETER
 * Alternative to Larson-Miller for creep rupture
 * MHP = (T - T_a) / (log(t_r) - log(t_a))
 */
export function mansonHaferdParameter(T, t_rupture, T_a = 273, t_a = 1) {
  return (T - T_a) / (Math.log10(t_rupture) - Math.log10(t_a));
}

/**
 * COMPLETE FATIGUE & CREEP ANALYZER
 */
export class FatigueCreepAnalyzer {
  constructor(params) {
    this.sigma_max = params.sigma_max;           // Maximum stress [Pa]
    this.sigma_min = params.sigma_min || 0;      // Minimum stress [Pa]
    this.T_max = params.T_max;                   // Maximum temperature [K]
    this.T_min = params.T_min || 293;            // Minimum temperature [K]
    this.cyclesPerFiring = params.cyclesPerFiring || 1;
    this.firingDuration = params.firingDuration || 180; // seconds
    
    // Material properties (Copper C18150)
    this.alpha = 17e-6;                          // CTE [1/K]
    this.E = 128e9;                              // Young's modulus [Pa]
    this.S_u = 450e6;                            // Ultimate tensile strength [Pa]
    this.epsf_prime = 0.5;                       // Fatigue ductility coefficient
    this.c = -0.6;                               // Fatigue ductility exponent
    this.sigmaf_prime = 800e6;                   // Fatigue strength coefficient [Pa]
    this.b = -0.12;                              // Fatigue strength exponent
    
    // Creep parameters
    this.A_creep = 1e-20;
    this.n_creep = 5;
    this.Q_creep = 300e3;                        // J/mol
    
    this.analyze();
  }
  
  analyze() {
    // 1. THERMAL FATIGUE
    const deltaT = this.T_max - this.T_min;
    this.deltaT = deltaT;
    
    // Thermal strain range
    this.epsilon_thermal = thermalStrainRange(this.alpha, deltaT);
    
    // Low-cycle fatigue life (Coffin-Manson)
    this.N_f_thermal = coffinMansonLife(
      this.epsilon_thermal,
      this.epsf_prime,
      this.c
    );
    
    // 2. MECHANICAL FATIGUE
    const deltaStress = this.sigma_max - this.sigma_min;
    this.deltaStress = deltaStress;
    
    const sigma_mean = (this.sigma_max + this.sigma_min) / 2;
    this.sigma_mean = sigma_mean;
    
    const sigma_alternating = deltaStress / 2;
    this.sigma_alternating = sigma_alternating;
    
    // Goodman correction for mean stress
    const S_f_corrected = goodmanCorrection(
      sigma_alternating,
      sigma_mean,
      this.S_u
    );
    
    // High-cycle fatigue life (Basquin)
    this.N_f_mechanical = basquinLife(
      deltaStress,
      this.sigmaf_prime,
      this.b
    );
    
    // 3. COMBINED FATIGUE LIFE
    // Use more conservative estimate
    this.N_f_combined = Math.min(this.N_f_thermal, this.N_f_mechanical);
    
    // 4. CREEP ANALYSIS
    // Creep rate at maximum stress and temperature
    this.creepRate = nortonCreepRate(
      this.sigma_max,
      this.T_max,
      this.A_creep,
      this.n_creep,
      this.Q_creep
    );
    
    // Creep strain per firing
    this.creepStrain_perFiring = this.creepRate * this.firingDuration;
    
    // Assume failure at 5% creep strain (typical)
    const epsilon_f_creep = 0.05;
    this.firings_to_creep_failure = epsilon_f_creep / this.creepStrain_perFiring;
    
    // 5. LARSON-MILLER PARAMETER
    // Estimate rupture time
    const t_rupture_hours = this.firings_to_creep_failure * (this.firingDuration / 3600);
    this.LMP = larsonMillerParameter(this.T_max, t_rupture_hours);
    
    // 6. CUMULATIVE DAMAGE (MINER'S RULE)
    // Assume mission profile: 100 firings
    const n_firings = 100;
    const cycles = [n_firings * this.cyclesPerFiring];
    const lives = [this.N_f_combined];
    
    this.damage_fatigue = minersRule(cycles, lives);
    
    // Creep damage
    this.damage_creep = (n_firings * this.firingDuration) / (this.firings_to_creep_failure * this.firingDuration);
    
    // Total damage
    this.damage_total = this.damage_fatigue + this.damage_creep;
    
    // 7. PREDICTED LIFE
    // Cycles to failure
    this.cycles_to_failure = this.N_f_combined;
    
    // Firings to failure (fatigue-limited)
    this.firings_to_failure_fatigue = this.N_f_combined / this.cyclesPerFiring;
    
    // Firings to failure (creep-limited)
    this.firings_to_failure_creep = this.firings_to_creep_failure;
    
    // Overall life (most conservative)
    this.firings_to_failure = Math.min(
      this.firings_to_failure_fatigue,
      this.firings_to_failure_creep
    );
    
    // 8. FAILURE MODE
    if (this.firings_to_failure_fatigue < this.firings_to_failure_creep) {
      this.failureMode = 'fatigue';
    } else {
      this.failureMode = 'creep';
    }
    
    // 9. SAFETY FACTOR
    const design_life = 100; // firings
    this.safetyFactor = this.firings_to_failure / design_life;
  }
  
  getResults() {
    return {
      // Thermal fatigue
      deltaT: this.deltaT,
      epsilon_thermal: this.epsilon_thermal,
      N_f_thermal: this.N_f_thermal,
      
      // Mechanical fatigue
      deltaStress: this.deltaStress,
      sigma_mean: this.sigma_mean,
      sigma_alternating: this.sigma_alternating,
      N_f_mechanical: this.N_f_mechanical,
      
      // Combined
      N_f_combined: this.N_f_combined,
      
      // Creep
      creepRate: this.creepRate,
      creepStrain_perFiring: this.creepStrain_perFiring,
      firings_to_creep_failure: this.firings_to_creep_failure,
      LMP: this.LMP,
      
      // Damage
      damage_fatigue: this.damage_fatigue,
      damage_creep: this.damage_creep,
      damage_total: this.damage_total,
      
      // Life prediction
      cycles_to_failure: this.cycles_to_failure,
      firings_to_failure_fatigue: this.firings_to_failure_fatigue,
      firings_to_failure_creep: this.firings_to_failure_creep,
      firings_to_failure: this.firings_to_failure,
      failureMode: this.failureMode,
      safetyFactor: this.safetyFactor,
    };
  }
  
  // Generate fatigue S-N curve data
  generateSNcurve() {
    const stressLevels = [];
    for (let sigma = 100e6; sigma <= 800e6; sigma += 50e6) {
      const N = basquinLife(sigma, this.sigmaf_prime, this.b);
      stressLevels.push({
        stress: sigma / 1e6, // MPa
        cycles: N,
      });
    }
    return stressLevels;
  }
}

export default {
  coffinMansonLife,
  thermalStrainRange,
  basquinLife,
  nortonCreepRate,
  larsonMillerParameter,
  ruptureTimeFromLMP,
  minersRule,
  goodmanCorrection,
  mansonHaferdParameter,
  FatigueCreepAnalyzer,
};
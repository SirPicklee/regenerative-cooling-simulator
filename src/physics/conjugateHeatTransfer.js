/**
 * CONJUGATE HEAT TRANSFER
 * Coupled solid-fluid heat transfer analysis
 * Models heat conduction in wall + convection to coolant
 */

/**
 * THERMAL CONDUCTIVITY - Temperature Dependent
 * For copper alloys (typical rocket engine material)
 * 
 * k(T) = k_0 * (1 - α*T)
 * Where α is temperature coefficient
 */
export function thermalConductivity(T, material = 'copper') {
  const materials = {
    'copper': {
      k_0: 400,      // W/(m·K) at room temp
      alpha: 0.0003, // Temperature coefficient
    },
    'steel': {
      k_0: 45,
      alpha: 0.0001,
    },
    'inconel': {
      k_0: 15,
      alpha: 0.0002,
    },
  };
  
  const mat = materials[material] || materials['copper'];
  const k = mat.k_0 * (1 - mat.alpha * (T - 300));
  
  return Math.max(10, k); // Minimum 10 W/(m·K)
}

/**
 * WALL TEMPERATURE PROFILE
 * 1D steady-state heat conduction through wall
 * 
 * Heat balance:
 * q_gas = k_wall * (T_hot - T_cold) / thickness = h_coolant * (T_cold - T_coolant)
 * 
 * Solving for T_hot and T_cold:
 * T_cold = (h_c*T_coolant + (k/t)*T_hot) / (h_c + k/t)
 */
export function wallTemperatureProfile(params) {
  const {
    T_gas,           // Gas temperature [K]
    T_coolant,       // Coolant temperature [K]
    h_gas,           // Gas-side HTC [W/(m²·K)]
    h_coolant,       // Coolant-side HTC [W/(m²·K)]
    thickness,       // Wall thickness [m]
    material,        // Material type
  } = params;
  
  // Iterative solution (wall temperature affects conductivity)
  let T_hot = T_gas;
  let T_cold = T_coolant;
  
  for (let iter = 0; iter < 20; iter++) {
    const T_avg = (T_hot + T_cold) / 2;
    const k_wall = thermalConductivity(T_avg, material);
    
    // Thermal resistance network
    const R_gas = 1 / h_gas;                    // Gas-side resistance
    const R_wall = thickness / k_wall;          // Wall resistance
    const R_coolant = 1 / h_coolant;            // Coolant-side resistance
    const R_total = R_gas + R_wall + R_coolant;
    
    // Heat flux
    const q = (T_gas - T_coolant) / R_total;
    
    // Temperature drops
    T_hot = T_gas - q * R_gas;
    T_cold = T_hot - q * R_wall;
  }
  
  return {
    T_hot: T_hot,           // Hot-side wall temperature
    T_cold: T_cold,         // Cold-side wall temperature
    T_avg: (T_hot + T_cold) / 2,
    q: (T_hot - T_cold) * thermalConductivity((T_hot + T_cold) / 2, material) / thickness,
  };
}

/**
 * BIOT NUMBER
 * Bi = h·L / k
 * 
 * Bi << 1: Temperature uniform in solid (lumped capacitance valid)
 * Bi >> 1: Significant temperature gradient in solid
 */
export function biotNumber(h, L, k) {
  return (h * L) / k;
}

/**
 * THERMAL RESISTANCE NETWORK
 * Series resistances: gas convection, wall conduction, coolant convection
 */
export function thermalResistances(h_gas, h_coolant, thickness, k_wall) {
  const R_gas = 1 / h_gas;
  const R_wall = thickness / k_wall;
  const R_coolant = 1 / h_coolant;
  const R_total = R_gas + R_wall + R_coolant;
  
  return {
    R_gas: R_gas,
    R_wall: R_wall,
    R_coolant: R_coolant,
    R_total: R_total,
    fraction_gas: R_gas / R_total,
    fraction_wall: R_wall / R_total,
    fraction_coolant: R_coolant / R_total,
  };
}

/**
 * HEAT FLUX THROUGH WALL
 * q = ΔT / R_total
 */
export function heatFlux(T_gas, T_coolant, R_total) {
  return (T_gas - T_coolant) / R_total;
}

/**
 * TEMPERATURE GRADIENT IN WALL
 * dT/dx = -q / k
 */
export function temperatureGradient(q, k) {
  return -q / k;
}

/**
 * WALL THERMAL STRESS
 * σ_thermal = E * α * ΔT / (1 - ν)
 * 
 * Where:
 * - E = Young's modulus
 * - α = thermal expansion coefficient
 * - ΔT = temperature difference
 * - ν = Poisson's ratio
 */
export function thermalStress(deltaT, material = 'copper') {
  const materials = {
    'copper': {
      E: 120e9,        // Pa
      alpha: 17e-6,    // 1/K
      nu: 0.34,
    },
    'steel': {
      E: 200e9,
      alpha: 12e-6,
      nu: 0.30,
    },
    'inconel': {
      E: 214e9,
      alpha: 13e-6,
      nu: 0.31,
    },
  };
  
  const mat = materials[material] || materials['copper'];
  const sigma = (mat.E * mat.alpha * deltaT) / (1 - mat.nu);
  
  return sigma;
}

/**
 * WALL THICKNESS OPTIMIZATION
 * Trade-off: thicker wall → higher thermal resistance but also higher thermal stress
 * 
 * Optimal thickness minimizes combined metric
 */
export function optimalThickness(params) {
  const {
    T_gas,
    T_coolant,
    h_gas,
    h_coolant,
    material,
    sigma_max,      // Maximum allowable stress
  } = params;
  
  // Try range of thicknesses
  const thicknesses = [];
  for (let t = 0.001; t <= 0.010; t += 0.0005) {
    const profile = wallTemperatureProfile({
      T_gas,
      T_coolant,
      h_gas,
      h_coolant,
      thickness: t,
      material,
    });
    
    const deltaT = profile.T_hot - profile.T_cold;
    const sigma = thermalStress(deltaT, material);
    const k = thermalConductivity(profile.T_avg, material);
    const Bi = biotNumber(h_gas, t, k);
    
    // Combined metric: minimize stress while maintaining reasonable Biot number
    const metric = sigma / sigma_max + Math.abs(Bi - 1.0);
    
    thicknesses.push({
      t: t,
      T_hot: profile.T_hot,
      T_cold: profile.T_cold,
      q: profile.q,
      sigma: sigma,
      Bi: Bi,
      metric: metric,
    });
  }
  
  // Find minimum metric
  let best = thicknesses[0];
  for (const item of thicknesses) {
    if (item.metric < best.metric) {
      best = item;
    }
  }
  
  return {
    optimal: best,
    all: thicknesses,
  };
}

/**
 * TRANSIENT HEAT CONDUCTION
 * Time to reach steady state
 * 
 * τ = ρ·c·L² / k
 * 
 * Where:
 * - ρ = density
 * - c = specific heat
 * - L = characteristic length
 * - k = thermal conductivity
 */
export function thermalTimeConstant(thickness, material = 'copper') {
  const materials = {
    'copper': {
      rho: 8960,     // kg/m³
      c: 385,        // J/(kg·K)
      k: 400,        // W/(m·K)
    },
    'steel': {
      rho: 7850,
      c: 460,
      k: 45,
    },
    'inconel': {
      rho: 8440,
      c: 435,
      k: 15,
    },
  };
  
  const mat = materials[material] || materials['copper'];
  const alpha = mat.k / (mat.rho * mat.c); // Thermal diffusivity
  const tau = thickness * thickness / alpha;
  
  return tau;
}

/**
 * COMPLETE CONJUGATE HEAT TRANSFER ANALYZER
 */
export class ConjugateHeatTransferAnalyzer {
  constructor(params) {
    this.T_gas = params.T_gas;
    this.T_coolant = params.T_coolant;
    this.h_gas = params.h_gas;
    this.h_coolant = params.h_coolant;
    this.thickness = params.thickness || 0.003; // 3mm default
    this.material = params.material || 'copper';
    this.sigma_max = params.sigma_max || 300e6; // 300 MPa
    
    this.analyze();
  }
  
  analyze() {
    // 1. Wall temperature profile
    const profile = wallTemperatureProfile({
      T_gas: this.T_gas,
      T_coolant: this.T_coolant,
      h_gas: this.h_gas,
      h_coolant: this.h_coolant,
      thickness: this.thickness,
      material: this.material,
    });
    
    this.T_hot = profile.T_hot;
    this.T_cold = profile.T_cold;
    this.T_avg = profile.T_avg;
    this.q = profile.q;
    
    // 2. Thermal conductivity
    this.k_wall = thermalConductivity(this.T_avg, this.material);
    
    // 3. Thermal resistances
    const resistances = thermalResistances(
      this.h_gas,
      this.h_coolant,
      this.thickness,
      this.k_wall
    );
    
    this.R_gas = resistances.R_gas;
    this.R_wall = resistances.R_wall;
    this.R_coolant = resistances.R_coolant;
    this.R_total = resistances.R_total;
    this.frac_gas = resistances.fraction_gas;
    this.frac_wall = resistances.fraction_wall;
    this.frac_coolant = resistances.fraction_coolant;
    
    // 4. Biot number
    this.Bi = biotNumber(this.h_gas, this.thickness, this.k_wall);
    
    // 5. Temperature gradient
    this.dT_dx = temperatureGradient(this.q, this.k_wall);
    
    // 6. Thermal stress
    const deltaT_wall = this.T_hot - this.T_cold;
    this.sigma_thermal = thermalStress(deltaT_wall, this.material);
    
    // 7. Thermal time constant
    this.tau = thermalTimeConstant(this.thickness, this.material);
    
    // 8. Safety factor
    this.safety_factor = this.sigma_max / Math.abs(this.sigma_thermal);
    
    // 9. Optimal thickness analysis
    const optimal = optimalThickness({
      T_gas: this.T_gas,
      T_coolant: this.T_coolant,
      h_gas: this.h_gas,
      h_coolant: this.h_coolant,
      material: this.material,
      sigma_max: this.sigma_max,
    });
    
    this.optimal_thickness = optimal.optimal;
    this.thickness_sweep = optimal.all;
  }
  
  getResults() {
    return {
      T_hot: this.T_hot,
      T_cold: this.T_cold,
      T_avg: this.T_avg,
      q: this.q,
      k_wall: this.k_wall,
      R_gas: this.R_gas,
      R_wall: this.R_wall,
      R_coolant: this.R_coolant,
      R_total: this.R_total,
      frac_gas: this.frac_gas,
      frac_wall: this.frac_wall,
      frac_coolant: this.frac_coolant,
      Bi: this.Bi,
      dT_dx: this.dT_dx,
      sigma_thermal: this.sigma_thermal,
      tau: this.tau,
      safety_factor: this.safety_factor,
      optimal_thickness: this.optimal_thickness,
      thickness_sweep: this.thickness_sweep,
    };
  }
}

export default {
  thermalConductivity,
  wallTemperatureProfile,
  biotNumber,
  thermalResistances,
  heatFlux,
  temperatureGradient,
  thermalStress,
  optimalThickness,
  thermalTimeConstant,
  ConjugateHeatTransferAnalyzer,
};
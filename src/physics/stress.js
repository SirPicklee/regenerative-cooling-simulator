/**
 * MATERIAL STRESS ANALYSIS
 * Thermal and pressure-induced stresses in rocket engine walls
 */

/**
 * MATERIAL PROPERTIES FOR STRESS ANALYSIS
 */
export const MATERIAL_PROPERTIES = {
  // Copper C18150 (GRCop-84)
  COPPER_C18150: {
    E: 128e9,              // Young's modulus [Pa]
    nu: 0.34,              // Poisson's ratio
    alpha: 17e-6,          // Thermal expansion coefficient [1/K]
    sigma_y: 400e6,        // Yield strength [Pa] at room temp
    sigma_y_hot: 250e6,    // Yield strength at 500°C
    sigma_uts: 450e6,      // Ultimate tensile strength [Pa]
  },
  
  // Inconel 718 (high-temp nickel alloy)
  INCONEL_718: {
    E: 200e9,
    nu: 0.29,
    alpha: 13e-6,
    sigma_y: 1100e6,
    sigma_y_hot: 850e6,
    sigma_uts: 1400e6,
  },
};

/**
 * THERMAL STRESS
 * σ_thermal = -E * α * ΔT / (1 - ν)
 * Compressive when heated, tensile when cooled
 */
export function thermalStress(E, alpha, deltaT, nu) {
  return -E * alpha * deltaT / (1 - nu);
}

/**
 * HOOP STRESS (Circumferential Stress)
 * For thin-walled pressure vessel: σ_θ = P * r / t
 * For thick-walled: σ_θ = P * (r_o² + r_i²) / (r_o² - r_i²)
 */
export function hoopStressThinWall(P, r, t) {
  // Thin wall approximation (t/r < 0.1)
  return P * r / t;
}

export function hoopStressThickWall(P, r_inner, r_outer, r) {
  // Thick wall (Lamé's equations)
  // At inner radius (maximum):
  const r_i = r_inner;
  const r_o = r_outer;
  
  const sigma_theta = P * (r_o * r_o + r * r) / (r_o * r_o - r_i * r_i);
  
  return sigma_theta;
}

/**
 * AXIAL STRESS (Longitudinal Stress)
 * For closed-end pressure vessel: σ_z = P * r / (2 * t)
 */
export function axialStressThinWall(P, r, t) {
  return P * r / (2 * t);
}

/**
 * RADIAL STRESS
 * For thick-walled cylinder: σ_r = -P * (r_o² - r²) / (r_o² - r_i²)
 */
export function radialStressThickWall(P, r_inner, r_outer, r) {
  const r_i = r_inner;
  const r_o = r_outer;
  
  const sigma_r = -P * (r_o * r_o - r * r) / (r_o * r_o - r_i * r_i);
  
  return sigma_r;
}

/**
 * VON MISES STRESS (Equivalent Stress)
 * For 3D stress state:
 * σ_vm = sqrt(0.5 * [(σ1-σ2)² + (σ2-σ3)² + (σ3-σ1)²])
 * 
 * For principal stresses σ_θ, σ_z, σ_r:
 * σ_vm = sqrt(σ_θ² + σ_z² + σ_r² - σ_θ*σ_z - σ_z*σ_r - σ_r*σ_θ)
 */
export function vonMisesStress(sigma_theta, sigma_z, sigma_r) {
  const term1 = sigma_theta * sigma_theta;
  const term2 = sigma_z * sigma_z;
  const term3 = sigma_r * sigma_r;
  const term4 = -sigma_theta * sigma_z;
  const term5 = -sigma_z * sigma_r;
  const term6 = -sigma_r * sigma_theta;
  
  return Math.sqrt(term1 + term2 + term3 + term4 + term5 + term6);
}

/**
 * SAFETY FACTOR
 * SF = σ_yield / σ_vm
 */
export function safetyFactor(sigma_yield, sigma_vm) {
  return sigma_yield / sigma_vm;
}

/**
 * STRESS CONCENTRATION FACTOR
 * For geometric discontinuities (holes, fillets, etc.)
 */
export const STRESS_CONCENTRATION = {
  SMOOTH_SURFACE: 1.0,
  SMALL_FILLET: 1.5,
  SHARP_CORNER: 2.5,
  HOLE: 3.0,
  CRACK_TIP: 10.0,
};

/**
 * TEMPERATURE-DEPENDENT YIELD STRENGTH
 * Linear interpolation between room temp and high temp
 */
export function yieldStrengthAtTemp(T, material = 'COPPER_C18150') {
  const mat = MATERIAL_PROPERTIES[material];
  
  const T_room = 293; // 20°C
  const T_hot = 773;  // 500°C
  
  if (T <= T_room) {
    return mat.sigma_y;
  } else if (T >= T_hot) {
    return mat.sigma_y_hot;
  } else {
    // Linear interpolation
    const fraction = (T - T_room) / (T_hot - T_room);
    return mat.sigma_y - fraction * (mat.sigma_y - mat.sigma_y_hot);
  }
}

/**
 * COMPLETE STRESS ANALYZER
 * Analyzes all stress components at a given location
 */
export class StressAnalyzer {
  constructor(params) {
    this.P = params.pressure;           // Internal pressure [Pa]
    this.r_inner = params.r_inner;      // Inner radius [m]
    this.r_outer = params.r_outer;      // Outer radius [m]
    this.T_hot = params.T_hot;          // Hot side temperature [K]
    this.T_cold = params.T_cold;        // Cold side temperature [K]
    this.T_ref = params.T_ref || 293;   // Reference temperature [K]
    this.material = params.material || 'COPPER_C18150';
    this.Kt = params.Kt || 1.0;         // Stress concentration factor
    
    this.mat = MATERIAL_PROPERTIES[this.material];
    this.t = this.r_outer - this.r_inner; // Wall thickness
    
    this.analyze();
  }
  
  analyze() {
    // Calculate stresses at inner radius (critical location)
    const r = this.r_inner;
    
    // 1. PRESSURE-INDUCED STRESSES
    // Check if thin or thick wall
    const ratio = this.t / this.r_inner;
    
    if (ratio < 0.1) {
      // Thin wall approximation
      this.sigma_theta_pressure = hoopStressThinWall(this.P, this.r_inner, this.t);
      this.sigma_z_pressure = axialStressThinWall(this.P, this.r_inner, this.t);
      this.sigma_r_pressure = 0; // Negligible for thin wall
    } else {
      // Thick wall (Lamé's equations)
      this.sigma_theta_pressure = hoopStressThickWall(this.P, this.r_inner, this.r_outer, r);
      this.sigma_z_pressure = this.P * this.r_inner * this.r_inner / (this.r_outer * this.r_outer - this.r_inner * this.r_inner);
      this.sigma_r_pressure = radialStressThickWall(this.P, this.r_inner, this.r_outer, r);
    }
    
    // 2. THERMAL STRESSES
    // Temperature gradient across wall
    const deltaT_hot = this.T_hot - this.T_ref;
    const deltaT_cold = this.T_cold - this.T_ref;
    const deltaT_gradient = this.T_hot - this.T_cold;
    
    // Thermal stress from temperature gradient
    this.sigma_thermal = thermalStress(
      this.mat.E,
      this.mat.alpha,
      deltaT_gradient,
      this.mat.nu
    );
    
    // 3. COMBINED STRESSES
    this.sigma_theta_total = (this.sigma_theta_pressure + this.sigma_thermal) * this.Kt;
    this.sigma_z_total = this.sigma_z_pressure * this.Kt;
    this.sigma_r_total = this.sigma_r_pressure;
    
    // 4. VON MISES EQUIVALENT STRESS
    this.sigma_vm = vonMisesStress(
      this.sigma_theta_total,
      this.sigma_z_total,
      this.sigma_r_total
    );
    
    // 5. YIELD STRENGTH AT OPERATING TEMPERATURE
    this.sigma_y_operating = yieldStrengthAtTemp(this.T_hot, this.material);
    
    // 6. SAFETY FACTOR
    this.SF = safetyFactor(this.sigma_y_operating, this.sigma_vm);
    
    // 7. FAILURE PREDICTION
    this.failureMode = this.predictFailure();
  }
  
  predictFailure() {
    if (this.SF < 1.0) {
      return {
        status: 'FAILURE',
        mode: 'Yield',
        description: 'Material will yield under operating conditions',
        severity: 'CRITICAL',
      };
    } else if (this.SF < 1.5) {
      return {
        status: 'WARNING',
        mode: 'Low Safety Margin',
        description: 'Safety factor below recommended minimum',
        severity: 'HIGH',
      };
    } else if (this.SF < 2.0) {
      return {
        status: 'CAUTION',
        mode: 'Moderate Safety',
        description: 'Acceptable but monitor closely',
        severity: 'MODERATE',
      };
    } else {
      return {
        status: 'SAFE',
        mode: 'Adequate Safety Margin',
        description: 'Operating within safe limits',
        severity: 'LOW',
      };
    }
  }
  
  getResults() {
    return {
      // Pressure stresses
      sigma_theta_pressure: this.sigma_theta_pressure,
      sigma_z_pressure: this.sigma_z_pressure,
      sigma_r_pressure: this.sigma_r_pressure,
      
      // Thermal stress
      sigma_thermal: this.sigma_thermal,
      
      // Combined stresses
      sigma_theta_total: this.sigma_theta_total,
      sigma_z_total: this.sigma_z_total,
      sigma_r_total: this.sigma_r_total,
      
      // Equivalent stress
      sigma_vm: this.sigma_vm,
      
      // Material properties
      sigma_y_operating: this.sigma_y_operating,
      E: this.mat.E,
      
      // Safety
      SF: this.SF,
      failureMode: this.failureMode,
      
      // Geometry
      wallThickness: this.t,
      thinWallRatio: this.t / this.r_inner,
    };
  }
}

/**
 * CREEP ANALYSIS
 * For high-temperature long-duration loading
 */
export function creepRate(sigma, T, A, n, Q, R) {
  // Norton-Bailey creep law
  // ε_dot = A * σ^n * exp(-Q / RT)
  return A * Math.pow(sigma, n) * Math.exp(-Q / (R * T));
}

/**
 * FATIGUE LIFE ESTIMATION
 * Basquin's equation for high-cycle fatigue
 */
export function fatigueLife(sigma_amplitude, sigma_f_prime, b) {
  // N = (σ_a / σ'_f)^(1/b)
  return Math.pow(sigma_amplitude / sigma_f_prime, 1 / b);
}

export default {
  MATERIAL_PROPERTIES,
  thermalStress,
  hoopStressThinWall,
  hoopStressThickWall,
  axialStressThinWall,
  radialStressThickWall,
  vonMisesStress,
  safetyFactor,
  STRESS_CONCENTRATION,
  yieldStrengthAtTemp,
  StressAnalyzer,
  creepRate,
  fatigueLife,
};
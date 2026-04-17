/**
 * EROSION & ABLATION ANALYSIS
 * Material degradation due to particle impact and thermal effects
 */

/**
 * PARTICLE EROSION RATE
 * Finnie model for solid particle erosion
 * 
 * E = K * V^n * f(θ)
 * 
 * Where:
 * - K = material constant
 * - V = particle velocity
 * - n = velocity exponent (2-3)
 * - θ = impact angle
 */
export function particleErosionRate(params) {
  const {
    V,              // Particle velocity [m/s]
    theta_deg,      // Impact angle [degrees]
    particleSize,   // Particle diameter [m]
    particleFlux,   // Particle mass flux [kg/(m²·s)]
    material,       // Wall material
  } = params;
  
  // Material constants (erosion resistance)
  const materials = {
    'copper': { K: 2.5e-9, n: 2.3, theta_max: 20 },
    'steel': { K: 1.8e-9, n: 2.5, theta_max: 25 },
    'inconel': { K: 1.2e-9, n: 2.6, theta_max: 30 },
    'ceramic': { K: 0.8e-9, n: 2.8, theta_max: 35 },
  };
  
  const mat = materials[material] || materials['copper'];
  
  // Impact angle function (ductile materials peak at low angles)
  const theta = theta_deg * Math.PI / 180;
  const theta_max = mat.theta_max * Math.PI / 180;
  
  let f_theta;
  if (theta_deg < mat.theta_max) {
    f_theta = Math.sin(theta) * (1 + 0.5 * Math.cos(2 * theta));
  } else {
    f_theta = Math.sin(theta_max) * (1 + 0.5 * Math.cos(2 * theta_max)) * 
              Math.exp(-0.1 * (theta_deg - mat.theta_max));
  }
  
  // Erosion rate [kg/(m²·s)]
  const E = mat.K * Math.pow(V, mat.n) * f_theta * particleFlux;
  
  return E;
}

/**
 * THERMAL ABLATION RATE
 * Recession rate due to thermal degradation
 * 
 * ṁ_ablation = ρ * v_recession
 * 
 * Energy balance:
 * q_incident = ρ * v_recession * (h_ablation + c * ΔT)
 */
export function thermalAblationRate(params) {
  const {
    q_incident,     // Incident heat flux [W/m²]
    T_wall,         // Wall temperature [K]
    T_melt,         // Melting temperature [K]
    material,       // Material type
  } = params;
  
  // Material properties
  const materials = {
    'copper': {
      rho: 8960,          // kg/m³
      h_ablation: 4.8e6,  // J/kg (melting + vaporization)
      c: 385,             // J/(kg·K)
      T_melt: 1358,       // K
    },
    'graphite': {
      rho: 2200,
      h_ablation: 6.0e7,  // Sublimation energy
      c: 710,
      T_melt: 3900,
    },
    'ceramic': {
      rho: 3900,
      h_ablation: 8.0e6,
      c: 880,
      T_melt: 2300,
    },
  };
  
  const mat = materials[material] || materials['copper'];
  
  // Only ablate if wall temperature approaches melting
  if (T_wall < mat.T_melt * 0.8) {
    return 0; // No ablation below 80% of melting temp
  }
  
  // Energy required for ablation
  const deltaT = Math.max(0, mat.T_melt - T_wall);
  const h_total = mat.h_ablation + mat.c * deltaT;
  
  // Recession velocity [m/s]
  const v_recession = q_incident / (mat.rho * h_total);
  
  // Mass loss rate [kg/(m²·s)]
  const m_dot_ablation = mat.rho * v_recession;
  
  return {
    v_recession: v_recession,        // m/s
    m_dot: m_dot_ablation,           // kg/(m²·s)
    thickness_loss: v_recession,     // m/s
  };
}

/**
 * OXIDATION RATE
 * Chemical degradation in oxidizing environment
 * 
 * Arrhenius equation:
 * k = A * exp(-E_a / (R*T))
 */
export function oxidationRate(T_wall, P_ox, material = 'copper') {
  // Arrhenius parameters
  const materials = {
    'copper': {
      A: 1e-6,           // Pre-exponential factor
      E_a: 120e3,        // Activation energy [J/mol]
    },
    'steel': {
      A: 5e-7,
      E_a: 150e3,
    },
  };
  
  const mat = materials[material] || materials['copper'];
  const R = 8.314; // J/(mol·K)
  
  // Rate constant
  const k = mat.A * Math.exp(-mat.E_a / (R * T_wall));
  
  // Oxidation rate (proportional to oxygen pressure)
  const rate = k * P_ox;
  
  return rate; // kg/(m²·s)
}

/**
 * CUMULATIVE EROSION DEPTH
 * Integrate erosion rate over time
 * 
 * depth = ∫ (E / ρ) dt
 */
export function cumulativeErosion(erosionRate, density, time) {
  // Recession velocity [m/s]
  const v_recession = erosionRate / density;
  
  // Depth over time [m]
  const depth = v_recession * time;
  
  return depth;
}

/**
 * EROSION PATTERN
 * Spatial distribution based on flow field
 */
export function erosionPattern(x, L_total, maxErosion) {
  // Peak erosion at throat (x/L ≈ 0.5)
  const x_normalized = x / L_total;
  const throat_position = 0.5;
  
  // Gaussian-like distribution centered at throat
  const sigma = 0.15;
  const erosion = maxErosion * Math.exp(-Math.pow(x_normalized - throat_position, 2) / (2 * sigma * sigma));
  
  return erosion;
}

/**
 * ABLATIVE COOLING EFFECTIVENESS
 * Heat absorbed by ablation
 * 
 * q_blocked = ṁ_ablation * h_ablation
 */
export function ablativeCooling(m_dot_ablation, h_ablation) {
  return m_dot_ablation * h_ablation;
}

/**
 * LIFETIME PREDICTION
 * Time until critical erosion depth reached
 * 
 * t_life = depth_critical / v_recession
 */
export function lifetimePrediction(depth_critical, v_recession) {
  if (v_recession <= 0) {
    return Infinity; // No erosion
  }
  
  const t_life = depth_critical / v_recession;
  
  return t_life; // seconds
}

/**
 * EROSION REGIME CLASSIFICATION
 */
export function erosionRegime(erosionRate) {
  // Classification based on erosion rate magnitude
  if (erosionRate < 1e-8) {
    return 'negligible';
  } else if (erosionRate < 1e-6) {
    return 'low';
  } else if (erosionRate < 1e-4) {
    return 'moderate';
  } else {
    return 'severe';
  }
}

/**
 * COMPLETE EROSION & ABLATION ANALYZER
 */
export class ErosionAblationAnalyzer {
  constructor(params) {
    this.V_particle = params.V_particle || 500;        // m/s
    this.particleSize = params.particleSize || 1e-6;   // 1 micron
    this.particleFlux = params.particleFlux || 0.01;   // kg/(m²·s)
    this.theta_impact = params.theta_impact || 15;     // degrees
    this.q_incident = params.q_incident;               // W/m²
    this.T_wall = params.T_wall;                       // K
    this.P_ox = params.P_ox || 1e5;                    // Pa
    this.material = params.material || 'copper';
    this.burnTime = params.burnTime || 180;            // seconds (3 min typical)
    this.thickness = params.thickness || 0.003;        // 3mm
    
    this.analyze();
  }
  
  analyze() {
    // 1. Particle erosion rate
    this.E_particle = particleErosionRate({
      V: this.V_particle,
      theta_deg: this.theta_impact,
      particleSize: this.particleSize,
      particleFlux: this.particleFlux,
      material: this.material,
    });
    
    // 2. Thermal ablation rate
    const ablation = thermalAblationRate({
      q_incident: this.q_incident,
      T_wall: this.T_wall,
      T_melt: this.material === 'copper' ? 1358 : 3900,
      material: this.material,
    });
    
    this.v_ablation = ablation.v_recession || 0;
    this.m_dot_ablation = ablation.m_dot || 0;
    
    // 3. Oxidation rate
    this.E_oxidation = oxidationRate(this.T_wall, this.P_ox, this.material);
    
    // 4. Total erosion rate
    this.E_total = this.E_particle + this.m_dot_ablation + this.E_oxidation;
    
    // 5. Material density
    const densities = {
      'copper': 8960,
      'steel': 7850,
      'inconel': 8440,
      'graphite': 2200,
      'ceramic': 3900,
    };
    this.rho = densities[this.material] || 8960;
    
    // 6. Cumulative erosion depth
    this.depth_eroded = cumulativeErosion(this.E_total, this.rho, this.burnTime);
    
    // 7. Remaining thickness
    this.thickness_remaining = this.thickness - this.depth_eroded;
    
    // 8. Erosion regime
    this.regime = erosionRegime(this.E_total);
    
    // 9. Lifetime prediction (until 50% thickness loss)
    const depth_critical = this.thickness * 0.5;
    const v_recession_total = this.E_total / this.rho;
    this.lifetime = lifetimePrediction(depth_critical, v_recession_total);
    
    // 10. Ablative cooling (if any)
    const h_ablation = this.material === 'copper' ? 4.8e6 : 6.0e7;
    this.q_blocked = ablativeCooling(this.m_dot_ablation, h_ablation);
    
    // 11. Number of burn cycles until failure
    this.cycles_to_failure = this.lifetime / this.burnTime;
    
    // 12. Erosion contributions (percentage)
    const total = this.E_particle + this.m_dot_ablation + this.E_oxidation;
    if (total > 0) {
      this.contrib_particle = (this.E_particle / total) * 100;
      this.contrib_ablation = (this.m_dot_ablation / total) * 100;
      this.contrib_oxidation = (this.E_oxidation / total) * 100;
    } else {
      this.contrib_particle = 0;
      this.contrib_ablation = 0;
      this.contrib_oxidation = 0;
    }
  }
  
  getResults() {
    return {
      E_particle: this.E_particle,
      E_oxidation: this.E_oxidation,
      m_dot_ablation: this.m_dot_ablation,
      v_ablation: this.v_ablation,
      E_total: this.E_total,
      depth_eroded: this.depth_eroded,
      thickness_remaining: this.thickness_remaining,
      regime: this.regime,
      lifetime: this.lifetime,
      q_blocked: this.q_blocked,
      cycles_to_failure: this.cycles_to_failure,
      contrib_particle: this.contrib_particle,
      contrib_ablation: this.contrib_ablation,
      contrib_oxidation: this.contrib_oxidation,
    };
  }
}

export default {
  particleErosionRate,
  thermalAblationRate,
  oxidationRate,
  cumulativeErosion,
  erosionPattern,
  ablativeCooling,
  lifetimePrediction,
  erosionRegime,
  ErosionAblationAnalyzer,
};
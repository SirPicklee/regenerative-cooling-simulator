/**
 * FILM COOLING EFFECTIVENESS
 * Protective film layer for thermal protection
 */

/**
 * BLOWING RATIO
 * M = (ρ_c * V_c) / (ρ_∞ * V_∞)
 * 
 * Where:
 * - ρ_c, V_c = coolant density and velocity
 * - ρ_∞, V_∞ = freestream density and velocity
 */
export function blowingRatio(rho_c, V_c, rho_inf, V_inf) {
  return (rho_c * V_c) / (rho_inf * V_inf);
}

/**
 * MOMENTUM FLUX RATIO
 * I = (ρ_c * V_c²) / (ρ_∞ * V_∞²)
 */
export function momentumFluxRatio(rho_c, V_c, rho_inf, V_inf) {
  return (rho_c * V_c * V_c) / (rho_inf * V_inf * V_inf);
}

/**
 * DENSITY RATIO
 * DR = ρ_c / ρ_∞
 */
export function densityRatio(rho_c, rho_inf) {
  return rho_c / rho_inf;
}

/**
 * ADIABATIC FILM COOLING EFFECTIVENESS
 * η = (T_∞ - T_aw) / (T_∞ - T_c)
 * 
 * Empirical correlation (laterally averaged):
 * η = (x/d)^(-0.5) * f(M, DR)
 * 
 * Where:
 * - x = downstream distance
 * - d = hole diameter
 * - M = blowing ratio
 * - DR = density ratio
 */
export function adiabaticEffectiveness(x, d, M, DR, holeSpacing = 3) {
  // Improved empirical correlation
  // Based on Baldauf et al. (2002) for shaped holes
  
  // Optimal blowing ratio range: 0.4-1.2
  let M_opt = 0.8;
  let M_factor = 1.0;
  
  if (M < M_opt) {
    // Under-blowing: linear increase
    M_factor = M / M_opt;
  } else if (M <= 2.0) {
    // Slightly over optimal: gentle decay
    M_factor = 1.0 - 0.3 * (M - M_opt) / (2.0 - M_opt);
  } else {
    // Severe lift-off
    M_factor = 0.5 / M;
  }
  
  // Density ratio correction (DR^0.25 better fit)
  const DR_factor = Math.pow(DR, 0.25);
  
  // Distance decay (more gradual for better correlation)
  const x_d = x / d;
  const decay = Math.pow(1 + 0.15 * x_d, -0.7); // Modified decay
  
  // Lateral spreading (hole spacing effect)
  const spacing_factor = Math.min(1.2, holeSpacing / 3.0);
  
  // Combined effectiveness with improved constants
  const C = 0.85; // Calibrated constant
  let eta = C * decay * M_factor * DR_factor * spacing_factor;
  
  // Clamp to physical range
  return Math.max(0, Math.min(0.95, eta));
}

/**
 * FILM TEMPERATURE
 * T_film = T_∞ - η * (T_∞ - T_c)
 */
export function filmTemperature(T_inf, T_c, eta) {
  return T_inf - eta * (T_inf - T_c);
}

/**
 * HEAT FLUX REDUCTION
 * q_film / q_no_film = 1 - η
 */
export function heatFluxReduction(eta) {
  return 1 - eta;
}

/**
 * FILM TRAJECTORY
 * Vertical penetration into freestream
 * 
 * y/d = C * (x/d)^n * M^m
 */
export function filmTrajectory(x, d, M) {
  const x_d = x / d;
  const C = 0.3;
  const n = 0.6;
  const m = 0.5;
  
  const y_d = C * Math.pow(x_d, n) * Math.pow(M, m);
  
  return y_d * d;
}

/**
 * COVERAGE AREA
 * Percentage of wall covered by film
 * Based on hole spacing and spreading angle
 */
export function coverageArea(numHoles, d, spreadAngle_deg, length) {
  // Film spreading half-angle
  const alpha = spreadAngle_deg * Math.PI / 180;
  
  // Width covered per hole at distance L
  const width_per_hole = 2 * length * Math.tan(alpha) + d;
  
  // Total width covered
  const total_width = numHoles * width_per_hole;
  
  // Assume circumferential distribution
  const circumference = Math.PI * 0.15; // ~15cm diameter nozzle
  
  const coverage = Math.min(1.0, total_width / circumference);
  
  return coverage;
}

/**
 * COOLANT MASS FLOW REQUIREMENT
 * ṁ_film = ṁ_main * (film_fraction)
 * 
 * Typical: 5-10% of main flow for film cooling
 */
export function filmCoolantFlow(mainFlow, filmFraction = 0.07) {
  return mainFlow * filmFraction;
}

/**
 * FILM HOLE DESIGN
 * Calculate hole diameter and spacing
 */
export function filmHoleDesign(params) {
  const {
    coolantFlow,      // kg/s
    numHoles,
    rho_c,            // kg/m³
    V_c,              // m/s (desired velocity)
  } = params;
  
  // Flow per hole
  const flow_per_hole = coolantFlow / numHoles;
  
  // Required area per hole
  const A_hole = flow_per_hole / (rho_c * V_c);
  
  // Hole diameter
  const d_hole = Math.sqrt(4 * A_hole / Math.PI);
  
  // Typical spacing (pitch/diameter ratio = 3-5)
  const p_d_ratio = 4;
  const spacing = p_d_ratio * d_hole;
  
  return {
    d_hole: d_hole,
    spacing: spacing,
    A_hole: A_hole,
    p_d_ratio: p_d_ratio,
  };
}

/**
 * COMPLETE FILM COOLING ANALYZER
 */
export class FilmCoolingAnalyzer {
  constructor(params) {
    this.T_gas = params.T_gas;              // Freestream gas temp [K]
    this.T_coolant = params.T_coolant;      // Coolant temp [K]
    this.rho_gas = params.rho_gas;          // Gas density [kg/m³]
    this.rho_coolant = params.rho_coolant;  // Coolant density [kg/m³]
    this.V_gas = params.V_gas;              // Gas velocity [m/s]
    this.V_coolant = params.V_coolant || 50; // Coolant velocity [m/s]
    this.numHoles = params.numHoles || 60;
    this.d_hole = params.d_hole || 0.0005;  // 0.5mm
    this.length = params.length || 0.05;    // 5cm downstream
    
    this.analyze();
  }
  
  analyze() {
    // 1. Blowing ratio
    this.M = blowingRatio(
      this.rho_coolant,
      this.V_coolant,
      this.rho_gas,
      this.V_gas
    );
    
    // 2. Momentum flux ratio
    this.I = momentumFluxRatio(
      this.rho_coolant,
      this.V_coolant,
      this.rho_gas,
      this.V_gas
    );
    
    // 3. Density ratio
    this.DR = densityRatio(this.rho_coolant, this.rho_gas);
    
    // 4. Film effectiveness at various distances
    this.effectiveness = [];
    const distances = [1, 3, 5, 10, 20, 30, 50, 100]; // in hole diameters
    
    for (const x_d of distances) {
      const x = x_d * this.d_hole;
      const eta = adiabaticEffectiveness(x, this.d_hole, this.M, this.DR);
      const T_film = filmTemperature(this.T_gas, this.T_coolant, eta);
      const q_reduction = heatFluxReduction(eta);
      
      this.effectiveness.push({
        x_d: x_d,
        x: x * 1000, // mm
        eta: eta,
        T_film: T_film,
        q_reduction: q_reduction,
      });
    }
    
    // 5. Average effectiveness over length
    this.eta_avg = adiabaticEffectiveness(
      this.length,
      this.d_hole,
      this.M,
      this.DR
    );
    
    // 6. Film trajectory
    this.y_film = filmTrajectory(this.length, this.d_hole, this.M);
    
    // 7. Coverage area
    const spreadAngle = 15; // degrees
    this.coverage = coverageArea(
      this.numHoles,
      this.d_hole,
      spreadAngle,
      this.length
    );
    
    // 8. Temperature reduction
    this.T_film_avg = filmTemperature(this.T_gas, this.T_coolant, this.eta_avg);
    this.deltaT_reduction = this.T_gas - this.T_film_avg;
    
    // 9. Heat flux reduction
    this.q_reduction_avg = heatFluxReduction(this.eta_avg);
    
    // 10. Blowing regime
    if (this.M < 0.3) {
      this.regime = 'low_blowing';
    } else if (this.M < 0.8) {
      this.regime = 'optimal';
    } else if (this.M < 2.0) {
      this.regime = 'high_blowing';
    } else {
      this.regime = 'jet_liftoff';
    }
  }
  
  getResults() {
    return {
      M: this.M,
      I: this.I,
      DR: this.DR,
      effectiveness: this.effectiveness,
      eta_avg: this.eta_avg,
      y_film: this.y_film,
      coverage: this.coverage,
      T_film_avg: this.T_film_avg,
      deltaT_reduction: this.deltaT_reduction,
      q_reduction_avg: this.q_reduction_avg,
      regime: this.regime,
    };
  }
}

export default {
  blowingRatio,
  momentumFluxRatio,
  densityRatio,
  adiabaticEffectiveness,
  filmTemperature,
  heatFluxReduction,
  filmTrajectory,
  coverageArea,
  filmCoolantFlow,
  filmHoleDesign,
  FilmCoolingAnalyzer,
};
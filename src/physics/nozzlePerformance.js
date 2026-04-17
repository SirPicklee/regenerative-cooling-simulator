/**
 * NOZZLE PERFORMANCE ANALYSIS
 * Thrust, specific impulse, efficiency calculations
 */

/**
 * THRUST CALCULATION
 * F = ṁ * V_e + (P_e - P_a) * A_e
 * Where:
 * - ṁ = mass flow rate [kg/s]
 * - V_e = exit velocity [m/s]
 * - P_e = exit pressure [Pa]
 * - P_a = ambient pressure [Pa]
 * - A_e = exit area [m²]
 */
export function thrust(massFlowRate, V_exit, P_exit, P_ambient, A_exit) {
  const momentumThrust = massFlowRate * V_exit;
  const pressureThrust = (P_exit - P_ambient) * A_exit;
  
  return {
    total: momentumThrust + pressureThrust,
    momentum: momentumThrust,
    pressure: pressureThrust,
  };
}

/**
 * SPECIFIC IMPULSE
 * I_sp = F / (ṁ * g_0)
 * Unit: seconds
 */
export function specificImpulse(thrust, massFlowRate, g0 = 9.80665) {
  return thrust / (massFlowRate * g0);
}

/**
 * EFFECTIVE EXHAUST VELOCITY
 * c = F / ṁ
 * Unit: m/s
 */
export function effectiveExhaustVelocity(thrust, massFlowRate) {
  return thrust / massFlowRate;
}

/**
 * CHARACTERISTIC VELOCITY
 * c* = (P_c * A_t) / ṁ
 * Measure of combustion efficiency
 * Unit: m/s
 */
export function characteristicVelocity(P_chamber, A_throat, massFlowRate) {
  return (P_chamber * A_throat) / massFlowRate;
}

/**
 * THRUST COEFFICIENT
 * C_F = F / (P_c * A_t)
 * Dimensionless measure of nozzle efficiency
 */
export function thrustCoefficient(thrust, P_chamber, A_throat) {
  return thrust / (P_chamber * A_throat);
}

/**
 * NOZZLE EFFICIENCY
 * η_nozzle = (actual c*) / (theoretical c*)
 */
export function nozzleEfficiency(c_star_actual, c_star_theoretical) {
  return c_star_actual / c_star_theoretical;
}

/**
 * THEORETICAL CHARACTERISTIC VELOCITY
 * c*_theoretical = √(γ * R * T_c) / [γ * √((2/(γ+1))^((γ+1)/(γ-1)))]
 */
export function theoreticalCharacteristicVelocity(gamma, R, T_chamber) {
  const numerator = Math.sqrt(gamma * R * T_chamber);
  const denominator = gamma * Math.sqrt(Math.pow(2 / (gamma + 1), (gamma + 1) / (gamma - 1)));
  
  return numerator / denominator;
}

/**
 * OPTIMAL EXPANSION RATIO
 * For maximum thrust at given altitude
 * P_e = P_a (optimal expansion)
 */
export function optimalExpansionRatio(P_chamber, P_ambient, gamma) {
  const P_ratio = P_ambient / P_chamber;
  const exponent = (gamma - 1) / gamma;
  
  const term1 = 2 / (gamma - 1);
  const term2 = 1 - Math.pow(P_ratio, exponent);
  const M_exit = Math.sqrt(term1 * term2);
  
  // Area ratio from Mach number (isentropic)
  const term3 = (gamma + 1) / 2;
  const term4 = 1 + ((gamma - 1) / 2) * M_exit * M_exit;
  const expansionRatio = (1 / M_exit) * Math.pow(term3 / term4, (gamma + 1) / (2 * (gamma - 1)));
  
  return expansionRatio;
}

/**
 * VACUUM SPECIFIC IMPULSE
 * I_sp_vac = I_sp + (P_e * A_e) / (ṁ * g_0)
 */
export function vacuumSpecificImpulse(Isp_sea, P_exit, A_exit, massFlowRate, g0 = 9.80665) {
  const pressureContribution = (P_exit * A_exit) / (massFlowRate * g0);
  return Isp_sea + pressureContribution;
}

/**
 * THRUST-TO-WEIGHT RATIO
 * TWR = F / (m * g)
 */
export function thrustToWeight(thrust, mass, g = 9.80665) {
  return thrust / (mass * g);
}

/**
 * MASS RATIO (Tsiolkovsky Rocket Equation)
 * Δv = I_sp * g_0 * ln(m_0 / m_f)
 */
export function massRatio(deltaV, Isp, g0 = 9.80665) {
  return Math.exp(deltaV / (Isp * g0));
}

/**
 * PROPELLANT MASS FRACTION
 * PMF = (m_0 - m_f) / m_0
 */
export function propellantMassFraction(m_initial, m_final) {
  return (m_initial - m_final) / m_initial;
}

/**
 * DIVERGENCE LOSS
 * Loss due to non-axial exhaust flow
 * λ = 0.5 * (1 + cos(θ))
 * where θ is half-angle of divergence
 */
export function divergenceLoss(halfAngle_deg) {
  const theta = halfAngle_deg * Math.PI / 180;
  return 0.5 * (1 + Math.cos(theta));
}

/**
 * COMPLETE NOZZLE PERFORMANCE ANALYZER
 */
export class NozzlePerformanceAnalyzer {
  constructor(params) {
    this.massFlowRate = params.massFlowRate;     // kg/s
    this.P_chamber = params.P_chamber;           // Pa
    this.T_chamber = params.T_chamber;           // K
    this.P_exit = params.P_exit;                 // Pa
    this.V_exit = params.V_exit;                 // m/s
    this.A_throat = params.A_throat;             // m²
    this.A_exit = params.A_exit;                 // m²
    this.P_ambient = params.P_ambient || 101325; // Pa (sea level default)
    this.gamma = params.gamma || 1.25;
    this.R = params.R || 8314.46 / 25;           // J/(kg·K)
    this.g0 = 9.80665;                           // m/s²
    
    this.analyze();
  }
  
  analyze() {
    // 1. THRUST
    const thrustResults = thrust(
      this.massFlowRate,
      this.V_exit,
      this.P_exit,
      this.P_ambient,
      this.A_exit
    );
    this.F_total = thrustResults.total;
    this.F_momentum = thrustResults.momentum;
    this.F_pressure = thrustResults.pressure;
    
    // 2. SPECIFIC IMPULSE
    this.Isp = specificImpulse(this.F_total, this.massFlowRate, this.g0);
    
    // 3. VACUUM SPECIFIC IMPULSE
    this.Isp_vac = vacuumSpecificImpulse(
      this.Isp,
      this.P_exit,
      this.A_exit,
      this.massFlowRate,
      this.g0
    );
    
    // 4. EFFECTIVE EXHAUST VELOCITY
    this.c_eff = effectiveExhaustVelocity(this.F_total, this.massFlowRate);
    
    // 5. CHARACTERISTIC VELOCITY
    this.c_star = characteristicVelocity(
      this.P_chamber,
      this.A_throat,
      this.massFlowRate
    );
    
    // 6. THEORETICAL CHARACTERISTIC VELOCITY
    this.c_star_theoretical = theoreticalCharacteristicVelocity(
      this.gamma,
      this.R,
      this.T_chamber
    );
    
    // 7. COMBUSTION EFFICIENCY
    this.eta_c_star = nozzleEfficiency(this.c_star, this.c_star_theoretical);
    
    // 8. THRUST COEFFICIENT
    this.CF = thrustCoefficient(this.F_total, this.P_chamber, this.A_throat);
    
    // 9. EXPANSION RATIO
    this.expansionRatio = this.A_exit / this.A_throat;
    
    // 10. OPTIMAL EXPANSION RATIO
    this.expansionRatio_optimal = optimalExpansionRatio(
      this.P_chamber,
      this.P_ambient,
      this.gamma
    );
    
    // 11. PRESSURE RATIO
    this.pressureRatio = this.P_exit / this.P_ambient;
    
    // 12. EXPANSION STATUS
    if (Math.abs(this.pressureRatio - 1.0) < 0.1) {
      this.expansionStatus = 'optimal';
    } else if (this.pressureRatio > 1.0) {
      this.expansionStatus = 'underexpanded';
    } else {
      this.expansionStatus = 'overexpanded';
    }
    
    // 13. NOZZLE EFFICIENCY
    const idealIsp = this.Isp_vac; // Simplified
    this.eta_nozzle = (this.Isp / idealIsp);
    
    // 14. THRUST PER UNIT AREA
    this.thrustDensity = this.F_total / this.A_exit;
  }
  
  getResults() {
    return {
      // Thrust components
      F_total: this.F_total,
      F_momentum: this.F_momentum,
      F_pressure: this.F_pressure,
      
      // Performance metrics
      Isp: this.Isp,
      Isp_vac: this.Isp_vac,
      c_eff: this.c_eff,
      c_star: this.c_star,
      c_star_theoretical: this.c_star_theoretical,
      eta_c_star: this.eta_c_star,
      CF: this.CF,
      
      // Expansion
      expansionRatio: this.expansionRatio,
      expansionRatio_optimal: this.expansionRatio_optimal,
      pressureRatio: this.pressureRatio,
      expansionStatus: this.expansionStatus,
      
      // Efficiency
      eta_nozzle: this.eta_nozzle,
      thrustDensity: this.thrustDensity,
    };
  }
  
  // Calculate thrust at different altitudes
  calculateAltitudePerformance(altitudes) {
    const results = [];
    
    for (const alt of altitudes) {
      // Atmospheric pressure at altitude (simplified)
      const P_atm = 101325 * Math.exp(-alt / 8500); // Scale height ~8.5km
      
      const thrustResults = thrust(
        this.massFlowRate,
        this.V_exit,
        this.P_exit,
        P_atm,
        this.A_exit
      );
      
      const isp = specificImpulse(thrustResults.total, this.massFlowRate, this.g0);
      
      results.push({
        altitude: alt,
        P_ambient: P_atm,
        thrust: thrustResults.total,
        Isp: isp,
      });
    }
    
    return results;
  }
}

export default {
  thrust,
  specificImpulse,
  effectiveExhaustVelocity,
  characteristicVelocity,
  thrustCoefficient,
  nozzleEfficiency,
  theoreticalCharacteristicVelocity,
  optimalExpansionRatio,
  vacuumSpecificImpulse,
  thrustToWeight,
  massRatio,
  propellantMassFraction,
  divergenceLoss,
  NozzlePerformanceAnalyzer,
};
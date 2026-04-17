/**
 * NOZZLE SHAPE OPTIMIZATION
 * Optimal contour design for maximum performance
 */

/**
 * THRUST COEFFICIENT
 * C_F = F / (P_c * A_t)
 * 
 * Ideal: C_F_ideal = sqrt(2γ²/(γ-1) * (2/(γ+1))^((γ+1)/(γ-1)) * [1-(P_e/P_c)^((γ-1)/γ)])
 */
export function thrustCoefficient(params) {
  const {
    gamma,
    P_c,          // Chamber pressure
    P_e,          // Exit pressure
    P_amb,        // Ambient pressure
    epsilon,      // Expansion ratio
  } = params;
  
  // Ideal thrust coefficient
  const term1 = 2 * gamma * gamma / (gamma - 1);
  const term2 = Math.pow(2 / (gamma + 1), (gamma + 1) / (gamma - 1));
  const term3 = 1 - Math.pow(P_e / P_c, (gamma - 1) / gamma);
  
  const C_F_ideal = Math.sqrt(term1 * term2 * term3);
  
  // Pressure correction term
  const pressure_term = epsilon * (P_e - P_amb) / P_c;
  
  const C_F = C_F_ideal + pressure_term;
  
  return {
    C_F: C_F,
    C_F_ideal: C_F_ideal,
    pressure_correction: pressure_term,
  };
}

/**
 * DIVERGENCE LOSS
 * Loss due to non-axial flow at nozzle exit
 * 
 * η_divergence = (1 + cos(α)) / 2
 * 
 * Where α = exit flow angle
 */
export function divergenceLoss(alpha_deg) {
  const alpha = alpha_deg * Math.PI / 180;
  const eta = (1 + Math.cos(alpha)) / 2;
  const loss = 1 - eta;
  
  return {
    efficiency: eta,
    loss_percent: loss * 100,
  };
}

/**
 * OPTIMAL EXIT ANGLE
 * Trade-off between divergence loss and nozzle length
 * 
 * Typical: 12-15° for bell nozzles
 */
export function optimalExitAngle(lengthFraction = 0.8) {
  // Full length (100%): ~12°
  // 80% length: ~15°
  // 60% length: ~18°
  
  const alpha_full = 12; // degrees
  const alpha = alpha_full / lengthFraction;
  
  return Math.min(alpha, 20); // Cap at 20°
}

/**
 * NOZZLE CONTOUR - Bell Shape
 * Optimized bell nozzle contour
 * 
 * Based on Rao's method (Method of Characteristics)
 */
export function bellNozzleContour(params) {
  const {
    R_t,          // Throat radius
    epsilon,      // Expansion ratio
    L_percent,    // Length percentage (0.6-1.0)
    theta_n,      // Initial expansion angle (20-40°)
    theta_e,      // Exit angle (8-15°)
  } = params;
  
  const R_e = R_t * Math.sqrt(epsilon); // Exit radius
  
  // Nozzle sections
  const contour = [];
  const numPoints = 50;
  
  // Throat region (circular arc)
  const R_curve = 1.5 * R_t; // Throat curvature radius
  
  // Divergent section length
  const L_cone = (R_e - R_t) / Math.tan(15 * Math.PI / 180); // 15° cone
  const L_nozzle = L_cone * L_percent;
  
  for (let i = 0; i <= numPoints; i++) {
    const x_norm = i / numPoints; // 0 to 1
    const x = x_norm * L_nozzle;
    
    // Bell curve profile (simplified parabolic)
    const theta_initial = theta_n * Math.PI / 180;
    const theta_exit = theta_e * Math.PI / 180;
    
    // Radius variation (smooth transition)
    const r = R_t + (R_e - R_t) * (
      x_norm + 
      0.3 * Math.sin(Math.PI * x_norm) * (1 - x_norm)
    );
    
    // Wall angle
    const dr_dx = (R_e - R_t) / L_nozzle * (
      1 + 0.3 * Math.PI * Math.cos(Math.PI * x_norm) * (1 - x_norm) -
      0.3 * Math.sin(Math.PI * x_norm)
    );
    const angle = Math.atan(dr_dx) * 180 / Math.PI;
    
    contour.push({
      x: x,
      r: r,
      angle: angle,
    });
  }
  
  return contour;
}

/**
 * CHARACTERISTIC VELOCITY (C*)
 * c* = P_c * A_t / ṁ
 */
export function characteristicVelocity(gamma, R, T_c) {
  const term1 = Math.sqrt(gamma * R * T_c);
  const term2 = gamma * Math.pow(2 / (gamma + 1), (gamma + 1) / (2 * (gamma - 1)));
  
  const c_star = term1 / term2;
  
  return c_star;
}

/**
 * SPECIFIC IMPULSE
 * I_sp = F / (ṁ * g_0)
 */
export function specificImpulse(C_F, c_star, P_c, g_0 = 9.81) {
  const I_sp = C_F * c_star / g_0;
  
  return I_sp;
}

/**
 * NOZZLE EFFICIENCY
 * Overall nozzle performance
 * 
 * η_nozzle = η_kinetic * η_divergence * η_boundary_layer
 */
export function nozzleEfficiency(params) {
  const {
    alpha_exit,       // Exit angle [deg]
    BL_loss,          // Boundary layer loss (0.98 typical)
    kinetic_eff,      // Kinetic efficiency (0.99 typical)
  } = params;
  
  const divergence = divergenceLoss(alpha_exit);
  
  const eta_total = kinetic_eff * divergence.efficiency * BL_loss;
  
  return {
    eta_total: eta_total,
    eta_divergence: divergence.efficiency,
    eta_kinetic: kinetic_eff,
    eta_BL: BL_loss,
  };
}

/**
 * LENGTH OPTIMIZATION
 * Trade-off between nozzle length and performance
 */
export function lengthOptimization(epsilon, L_fractions) {
  const results = [];
  
  for (const L_frac of L_fractions) {
    const alpha_exit = optimalExitAngle(L_frac);
    const div = divergenceLoss(alpha_exit);
    
    // Length (normalized)
    const R_t = 1.0; // Normalized
    const R_e = Math.sqrt(epsilon);
    const L_cone = (R_e - R_t) / Math.tan(15 * Math.PI / 180);
    const L = L_cone * L_frac;
    
    results.push({
      L_percent: L_frac * 100,
      L: L,
      alpha_exit: alpha_exit,
      efficiency: div.efficiency,
      loss: div.loss_percent,
    });
  }
  
  return results;
}

/**
 * EXPANSION RATIO OPTIMIZATION
 * Find optimal expansion ratio for given conditions
 */
export function optimalExpansionRatio(params) {
  const {
    P_c,            // Chamber pressure
    P_amb,          // Ambient pressure
    gamma,
  } = params;
  
  // Ideal: P_e = P_amb (perfectly expanded)
  const P_e_ideal = P_amb;
  
  // Expansion ratio for P_e = P_amb
  const exponent = gamma / (gamma - 1);
  const epsilon_ideal = Math.pow(P_c / P_e_ideal, 1 / exponent);
  
  return {
    epsilon_ideal: epsilon_ideal,
    P_e_ideal: P_e_ideal,
  };
}

/**
 * COMPLETE NOZZLE OPTIMIZATION ANALYZER
 */
export class NozzleOptimizationAnalyzer {
  constructor(params) {
    this.gamma = params.gamma || 1.2;
    this.R = params.R || 320;          // Gas constant [J/(kg·K)]
    this.T_c = params.T_c || 3500;     // Chamber temp [K]
    this.P_c = params.P_c || 300e5;    // Chamber pressure [Pa]
    this.P_amb = params.P_amb || 1e5;  // Ambient pressure [Pa]
    this.epsilon = params.epsilon || 16; // Expansion ratio
    this.R_t = params.R_t || 0.075;    // Throat radius [m]
    
    this.analyze();
  }
  
  analyze() {
    // 1. Exit pressure (isentropic expansion)
    const exponent = this.gamma / (this.gamma - 1);
    this.P_e = this.P_c / Math.pow(this.epsilon, exponent);
    
    // 2. Thrust coefficient
    const CF_result = thrustCoefficient({
      gamma: this.gamma,
      P_c: this.P_c,
      P_e: this.P_e,
      P_amb: this.P_amb,
      epsilon: this.epsilon,
    });
    
    this.C_F = CF_result.C_F;
    this.C_F_ideal = CF_result.C_F_ideal;
    
    // 3. Characteristic velocity
    this.c_star = characteristicVelocity(this.gamma, this.R, this.T_c);
    
    // 4. Specific impulse
    this.I_sp = specificImpulse(this.C_F, this.c_star, this.P_c);
    
    // 5. Optimal exit angle
    const L_percent = 0.8; // 80% bell nozzle
    this.alpha_exit = optimalExitAngle(L_percent);
    
    // 6. Divergence loss
    const div = divergenceLoss(this.alpha_exit);
    this.eta_divergence = div.efficiency;
    this.divergence_loss = div.loss_percent;
    
    // 7. Overall efficiency
    const eff = nozzleEfficiency({
      alpha_exit: this.alpha_exit,
      BL_loss: 0.98,
      kinetic_eff: 0.99,
    });
    
    this.eta_nozzle = eff.eta_total;
    this.eta_BL = eff.eta_BL;
    this.eta_kinetic = eff.eta_kinetic;
    
    // 8. Nozzle contour
    this.contour = bellNozzleContour({
      R_t: this.R_t,
      epsilon: this.epsilon,
      L_percent: L_percent,
      theta_n: 30,  // 30° initial expansion
      theta_e: this.alpha_exit,
    });
    
    // 9. Length optimization sweep
    const L_fractions = [0.6, 0.7, 0.8, 0.9, 1.0];
    this.lengthTradeoff = lengthOptimization(this.epsilon, L_fractions);
    
    // 10. Optimal expansion ratio
    const opt = optimalExpansionRatio({
      P_c: this.P_c,
      P_amb: this.P_amb,
      gamma: this.gamma,
    });
    
    this.epsilon_optimal = opt.epsilon_ideal;
    this.expansion_ratio_error = ((this.epsilon - this.epsilon_optimal) / this.epsilon_optimal) * 100;
    
    // 11. Performance metrics
    this.R_e = this.R_t * Math.sqrt(this.epsilon);
    this.A_t = Math.PI * this.R_t * this.R_t;
    this.A_e = Math.PI * this.R_e * this.R_e;
    
    // 12. Nozzle length
    const L_cone = (this.R_e - this.R_t) / Math.tan(15 * Math.PI / 180);
    this.L_nozzle = L_cone * L_percent;
  }
  
  getResults() {
    return {
      C_F: this.C_F,
      C_F_ideal: this.C_F_ideal,
      c_star: this.c_star,
      I_sp: this.I_sp,
      alpha_exit: this.alpha_exit,
      eta_nozzle: this.eta_nozzle,
      eta_divergence: this.eta_divergence,
      divergence_loss: this.divergence_loss,
      epsilon: this.epsilon,
      epsilon_optimal: this.epsilon_optimal,
      expansion_ratio_error: this.expansion_ratio_error,
      P_e: this.P_e,
      contour: this.contour,
      lengthTradeoff: this.lengthTradeoff,
      L_nozzle: this.L_nozzle,
      R_e: this.R_e,
    };
  }
}

export default {
  thrustCoefficient,
  divergenceLoss,
  optimalExitAngle,
  bellNozzleContour,
  characteristicVelocity,
  specificImpulse,
  nozzleEfficiency,
  lengthOptimization,
  optimalExpansionRatio,
  NozzleOptimizationAnalyzer,
};
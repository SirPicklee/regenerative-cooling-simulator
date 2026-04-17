/**
 * TWO-PHASE FLOW ANALYSIS
 * Boiling heat transfer, critical heat flux, void fraction
 */

/**
 * ONSET OF NUCLEATE BOILING (ONB)
 * Condition when bubbles first form on wall
 * 
 * q_ONB = h * (T_sat - T_bulk)
 * Where T_sat determined by local pressure
 */
export function onsetNucleateBoiling(h_conv, T_sat, T_bulk) {
  return h_conv * (T_sat - T_bulk);
}

/**
 * SATURATION TEMPERATURE
 * Clausius-Clapeyron approximation for methane
 * 
 * For CH4: T_sat ≈ T_ref * (P/P_ref)^0.11
 * More accurate: Antoine equation
 */
export function saturationTemperature(P, fluid = 'CH4') {
  // Antoine equation coefficients for methane
  // log10(P_sat[bar]) = A - B/(C + T[K])
  const coeffs = {
    CH4: { A: 3.9895, B: 443.028, C: -0.49 },
    // Could add more fluids
  };
  
  const { A, B, C } = coeffs[fluid];
  
  // Rearrange: T = B/(A - log10(P)) - C
  const P_bar = P / 1e5; // Convert Pa to bar
  const T_sat = B / (A - Math.log10(P_bar)) - C;
  
  return T_sat;
}

/**
 * LATENT HEAT OF VAPORIZATION
 * Temperature-dependent for methane
 * 
 * h_fg ≈ h_fg_ref * (1 - T/T_crit)^0.38
 */
export function latentHeat(T, T_crit = 190.6, h_fg_ref = 510e3) {
  // For methane: T_crit = 190.6 K, h_fg ≈ 510 kJ/kg at NBP
  const ratio = 1 - T / T_crit;
  if (ratio <= 0) return 0; // Above critical point
  
  return h_fg_ref * Math.pow(ratio, 0.38);
}

/**
 * CRITICAL HEAT FLUX (CHF)
 * Maximum heat flux before DNB (Departure from Nucleate Boiling)
 * 
 * Bowring correlation for subcooled flow boiling:
 * q_CHF = (A + B*x_e) * G * h_fg
 * 
 * Where:
 * - x_e = equilibrium quality
 * - G = mass flux [kg/(m²·s)]
 * - h_fg = latent heat
 */
export function criticalHeatFlux(G, h_fg, x_e, D_h = 0.002) {
  // Simplified correlation
  // Full Bowring has many correction factors
  
  // Parameters
  const A = 0.25; // Empirical coefficient
  const B = 0.15;
  
  const q_CHF = (A + B * Math.abs(x_e)) * G * h_fg;
  
  return q_CHF;
}

/**
 * EQUILIBRIUM QUALITY
 * Thermodynamic quality (what quality would be at thermal equilibrium)
 * 
 * x_e = (h_bulk - h_f) / h_fg
 */
export function equilibriumQuality(h_bulk, h_f, h_fg) {
  return (h_bulk - h_f) / h_fg;
}

/**
 * SUBCOOLING
 * ΔT_sub = T_sat - T_bulk
 */
export function subcooling(T_sat, T_bulk) {
  return T_sat - T_bulk;
}

/**
 * VOID FRACTION
 * Fraction of channel occupied by vapor
 * 
 * Homogeneous model (simple):
 * α = x / (x + (1-x) * ρ_g/ρ_f)
 * 
 * Drift flux model (more accurate):
 * α = x/(C_0 * ρ_g/ρ_f + x * (1 - ρ_g/ρ_f))
 */
export function voidFraction(x, rho_g, rho_f, model = 'homogeneous') {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  
  if (model === 'homogeneous') {
    // Simple homogeneous model
    const beta = rho_g / rho_f;
    return x / (x + (1 - x) * beta);
  } else {
    // Drift flux (Chexal-Lellouche)
    const C_0 = 1.2; // Distribution parameter
    const beta = rho_g / rho_f;
    return x / (C_0 * beta + x * (1 - beta));
  }
}

/**
 * FLOW BOILING HEAT TRANSFER COEFFICIENT
 * Chen correlation for nucleate + convective boiling
 * 
 * h_tp = F * h_sp + S * h_nb
 * 
 * Where:
 * - h_sp = single-phase convective (Dittus-Boelter)
 * - h_nb = nucleate boiling (Forster-Zuber)
 * - F = two-phase multiplier
 * - S = suppression factor
 */
export function chenCorrelation(params) {
  const {
    G,           // Mass flux [kg/(m²·s)]
    x,           // Quality
    D_h,         // Hydraulic diameter [m]
    k_f,         // Liquid thermal conductivity [W/(m·K)]
    mu_f,        // Liquid viscosity [Pa·s]
    rho_f,       // Liquid density [kg/m³]
    rho_g,       // Vapor density [kg/m³]
    cp_f,        // Liquid specific heat [J/(kg·K)]
    h_fg,        // Latent heat [J/kg]
    sigma,       // Surface tension [N/m]
    deltaT_sat,  // Wall superheat [K]
  } = params;
  
  // Single-phase convective component (Dittus-Boelter)
  const Re_f = G * (1 - x) * D_h / mu_f;
  const Pr_f = cp_f * mu_f / k_f;
  const Nu_sp = 0.023 * Math.pow(Re_f, 0.8) * Math.pow(Pr_f, 0.4);
  const h_sp = Nu_sp * k_f / D_h;
  
  // Nucleate boiling component (Forster-Zuber)
  const h_nb = 0.00122 * Math.pow(k_f, 0.79) * Math.pow(cp_f, 0.45) * Math.pow(rho_f, 0.49) /
               (Math.pow(sigma, 0.5) * Math.pow(mu_f, 0.29) * Math.pow(h_fg, 0.24) * Math.pow(rho_g, 0.24)) *
               Math.pow(deltaT_sat, 0.24);
  
  // Vapor viscosity approximation
  const mu_g = mu_f * 0.1; // Gas viscosity ~10% of liquid
  
  // Two-phase multiplier (F)
  const X_tt = Math.pow((1 - x) / x, 0.9) * Math.pow(rho_g / rho_f, 0.5) * Math.pow(mu_f / mu_g, 0.1);
  const F = X_tt < 0.1 ? 1 : Math.pow(X_tt, -0.5);
  
  // Suppression factor (S)
  const Re_tp = G * D_h / mu_f;
  const S = 1 / (1 + 2.53e-6 * Math.pow(Re_tp * F * F, 1.17));
  
  // Combined heat transfer coefficient
  const h_tp = F * h_sp + S * h_nb;
  
  return {
    h_tp: h_tp,
    h_sp: h_sp,
    h_nb: h_nb,
    F: F,
    S: S,
  };
}

/**
 * FLOW REGIME MAP
 * Determine flow pattern based on superficial velocities
 * 
 * Regimes:
 * - Bubbly: Small bubbles dispersed in liquid
 * - Slug: Large Taylor bubbles
 * - Churn: Chaotic, oscillatory
 * - Annular: Liquid film on wall, vapor core
 * - Mist: Droplets in vapor
 */
export function flowRegime(j_g, j_f, rho_g, rho_f, sigma, D_h, g = 9.81) {
  // Superficial velocities
  // j_g = Q_g / A
  // j_f = Q_f / A
  
  // Transition criteria (simplified Taitel-Dukler)
  const j_transition = 0.2 * Math.sqrt(sigma * g * (rho_f - rho_g) / (rho_f * rho_f));
  
  if (j_g < 0.1 * j_transition) {
    return 'bubbly';
  } else if (j_g < j_transition) {
    return 'slug';
  } else if (j_g < 3 * j_transition) {
    return 'churn';
  } else if (j_f > 0.5) {
    return 'annular';
  } else {
    return 'mist';
  }
}

/**
 * COMPLETE TWO-PHASE FLOW ANALYZER
 */
export class TwoPhaseFlowAnalyzer {
  constructor(params) {
    this.P = params.P;                     // Pressure [Pa]
    this.T_bulk = params.T_bulk;           // Bulk fluid temperature [K]
    this.T_wall = params.T_wall;           // Wall temperature [K]
    this.massFlowRate = params.massFlowRate; // kg/s
    this.D_h = params.D_h || 0.002;        // Hydraulic diameter [m]
    this.A_flow = params.A_flow || 6e-6;   // Flow area [m²]
    this.h_conv = params.h_conv || 10000;  // Convective coefficient [W/(m²·K)]
    
    // Fluid properties (methane liquid/vapor)
    this.rho_f = 422;      // kg/m³ at 111K
    this.rho_g = 1.8;      // kg/m³ (vapor)
    this.mu_f = 1.1e-4;    // Pa·s
    this.cp_f = 3500;      // J/(kg·K)
    this.k_f = 0.2;        // W/(m·K)
    this.sigma = 0.013;    // N/m (surface tension)
    
    this.analyze();
  }
  
  analyze() {
    // 1. Saturation temperature
    this.T_sat = saturationTemperature(this.P);
    
    // 2. Subcooling
    this.deltaT_sub = subcooling(this.T_sat, this.T_bulk);
    
    // 3. Latent heat
    this.h_fg = latentHeat(this.T_sat);
    
    // 4. ONB heat flux
    this.q_ONB = onsetNucleateBoiling(this.h_conv, this.T_sat, this.T_bulk);
    
    // 5. Is boiling occurring?
    const q_actual = this.h_conv * (this.T_wall - this.T_bulk);
    // Boiling ONLY if: wall hotter than saturation AND heat flux exceeds ONB
    this.isBoiling = this.T_wall > this.T_sat && this.deltaT_sub < 0 && q_actual > this.q_ONB;
    
    // 6. Mass flux
    this.G = this.massFlowRate / this.A_flow;
    
    // 7. Equilibrium quality (estimate)
    const h_f = this.cp_f * this.T_bulk;
    const h_fg_ref = this.h_fg;
    this.x_e = equilibriumQuality(h_f, this.cp_f * this.T_sat, h_fg_ref);
    this.x_e = Math.max(-0.5, Math.min(0.5, this.x_e)); // Clamp
    
    // 8. Critical Heat Flux
    this.q_CHF = criticalHeatFlux(this.G, this.h_fg, this.x_e, this.D_h);
    
    // 9. CHF Ratio (safety margin) - protect against division by zero
    if (this.q_CHF > 1000) { // Minimum realistic CHF
      this.CHF_ratio = q_actual / this.q_CHF;
    } else {
      this.CHF_ratio = 0; // Very low CHF, assume safe
    }
    
    // 10. Void fraction (if boiling)
    if (this.isBoiling && this.x_e > 0) {
      this.alpha = voidFraction(this.x_e, this.rho_g, this.rho_f, 'drift-flux');
    } else {
      this.alpha = 0;
    }
    
    // 11. Two-phase heat transfer coefficient (if boiling)
    if (this.isBoiling && this.x_e > 0) {
      const deltaT_sat = Math.max(1, this.T_wall - this.T_sat);
      
      try {
        const chen = chenCorrelation({
          G: this.G,
          x: Math.max(0.001, Math.min(0.9, this.x_e)),
          D_h: this.D_h,
          k_f: this.k_f,
          mu_f: this.mu_f,
          rho_f: this.rho_f,
          rho_g: this.rho_g,
          cp_f: this.cp_f,
          h_fg: this.h_fg,
          sigma: this.sigma,
          deltaT_sat: deltaT_sat,
        });
        
        // Safety checks for infinity
        this.h_tp = isFinite(chen.h_tp) ? chen.h_tp : this.h_conv;
        this.h_nb = isFinite(chen.h_nb) ? chen.h_nb : 0;
        this.h_sp = isFinite(chen.h_sp) ? chen.h_sp : this.h_conv;
        this.F_factor = isFinite(chen.F) ? chen.F : 1;
        this.S_factor = isFinite(chen.S) ? chen.S : 0;
      } catch (error) {
        // Fallback to single-phase
        this.h_tp = this.h_conv;
        this.h_nb = 0;
        this.h_sp = this.h_conv;
        this.F_factor = 1;
        this.S_factor = 0;
      }
    } else {
      this.h_tp = this.h_conv;
      this.h_nb = 0;
      this.h_sp = this.h_conv;
      this.F_factor = 1;
      this.S_factor = 0;
    }
    
    // 12. Flow regime
    if (this.isBoiling && this.x_e > 0) {
      const j_g = this.G * this.x_e / this.rho_g;
      const j_f = this.G * (1 - this.x_e) / this.rho_f;
      this.regime = flowRegime(j_g, j_f, this.rho_g, this.rho_f, this.sigma, this.D_h);
    } else {
      this.regime = 'single-phase';
    }
  }
  
  getResults() {
    return {
      T_sat: this.T_sat,
      deltaT_sub: this.deltaT_sub,
      h_fg: this.h_fg,
      q_ONB: this.q_ONB,
      isBoiling: this.isBoiling,
      G: this.G,
      x_e: this.x_e,
      q_CHF: this.q_CHF,
      CHF_ratio: this.CHF_ratio,
      alpha: this.alpha,
      h_tp: this.h_tp,
      h_nb: this.h_nb,
      h_sp: this.h_sp,
      F_factor: this.F_factor,
      S_factor: this.S_factor,
      regime: this.regime,
    };
  }
}

export default {
  onsetNucleateBoiling,
  saturationTemperature,
  latentHeat,
  criticalHeatFlux,
  equilibriumQuality,
  subcooling,
  voidFraction,
  chenCorrelation,
  flowRegime,
  TwoPhaseFlowAnalyzer,
};
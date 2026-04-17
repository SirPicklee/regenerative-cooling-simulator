/**
 * INJECTOR DESIGN & SPRAY ATOMIZATION
 * Droplet breakup, SMD, Weber number, mixing efficiency
 */

/**
 * SAUTER MEAN DIAMETER (SMD) - D32
 * Volume/Surface area mean diameter
 * 
 * Simplified correlation for pressure atomizers:
 * SMD = C * (σ/ρ_g)^0.5 * (μ_l/ρ_l)^0.25 * (ΔP)^(-0.5) * (ṁ/A)^(-0.25)
 */
export function sauterMeanDiameter(params) {
  const {
    sigma,      // Surface tension [N/m]
    rho_l,      // Liquid density [kg/m³]
    rho_g,      // Gas density [kg/m³]
    mu_l,       // Liquid viscosity [Pa·s]
    deltaP,     // Pressure drop [Pa]
    massFlux,   // Mass flux [kg/(m²·s)]
  } = params;
  
  const C = 3.67; // Empirical constant
  
  const term1 = Math.pow(sigma / rho_g, 0.5);
  const term2 = Math.pow(mu_l / rho_l, 0.25);
  const term3 = Math.pow(deltaP, -0.5);
  const term4 = Math.pow(massFlux, -0.25);
  
  const SMD = C * term1 * term2 * term3 * term4;
  
  return SMD * 1e6; // Convert to micrometers
}

/**
 * WEBER NUMBER
 * Ratio of inertial to surface tension forces
 * 
 * We = ρ * V² * D / σ
 * 
 * We < 12: No breakup
 * 12 < We < 50: Bag breakup
 * 50 < We < 100: Multimode breakup
 * We > 100: Shear breakup
 */
export function weberNumber(rho, V, D, sigma) {
  return (rho * V * V * D) / sigma;
}

/**
 * OHNESORGE NUMBER
 * Ratio of viscous to surface tension forces
 * 
 * Oh = We^0.5 / Re = μ / (ρ * σ * D)^0.5
 */
export function ohnesorgeNumber(mu, rho, sigma, D) {
  return mu / Math.sqrt(rho * sigma * D);
}

/**
 * BREAKUP REGIME
 * Based on Weber and Ohnesorge numbers
 */
export function breakupRegime(We, Oh) {
  if (We < 12) {
    return 'no_breakup';
  } else if (We < 50) {
    return 'bag_breakup';
  } else if (We < 100) {
    return 'multimode';
  } else if (We < 350) {
    return 'shear_breakup';
  } else {
    return 'atomization';
  }
}

/**
 * SPRAY CONE ANGLE
 * For pressure swirl atomizers
 * 
 * θ = 2 * arctan(A_n / (A_o - A_n))
 * 
 * Simplified: θ ≈ 60-90° for typical rocket injectors
 */
export function sprayConeAngle(flowNumber, ambientPressure, injectionPressure) {
  // Simplified empirical correlation
  const pressureRatio = injectionPressure / ambientPressure;
  
  // Higher pressure ratio → wider spray
  const baseAngle = 70; // degrees
  const angleIncrease = Math.min(20, Math.log10(pressureRatio) * 10);
  
  return baseAngle + angleIncrease;
}

/**
 * ATOMIZATION QUALITY
 * Based on SMD - smaller is better
 * 
 * Excellent: SMD < 50 μm
 * Good: 50-100 μm
 * Fair: 100-200 μm
 * Poor: > 200 μm
 */
export function atomizationQuality(SMD) {
  if (SMD < 50) return 'excellent';
  if (SMD < 100) return 'good';
  if (SMD < 200) return 'fair';
  return 'poor';
}

/**
 * MIXING EFFICIENCY
 * Based on penetration depth and spray angle
 * 
 * η_mix = f(penetration, atomization, turbulence)
 */
export function mixingEfficiency(SMD, sprayAngle, velocity, turbulenceIntensity) {
  // Simplified model
  // Better atomization (smaller SMD) → better mixing
  // Wider spray angle → better mixing
  // Higher turbulence → better mixing
  
  const SMD_factor = Math.exp(-SMD / 100); // 0-1, higher for smaller SMD
  const angle_factor = Math.min(1, sprayAngle / 90); // 0-1
  const turb_factor = Math.min(1, turbulenceIntensity / 0.1); // 0-1
  
  const eta_mix = 0.4 * SMD_factor + 0.3 * angle_factor + 0.3 * turb_factor;
  
  return Math.min(1, eta_mix);
}

/**
 * IMPINGEMENT PATTERN
 * For like-doublet or unlike-doublet injectors
 */
export function impingementAngle(injectorType = 'unlike-doublet') {
  // Typical impingement angles
  const angles = {
    'like-doublet': 60,      // Both fuel or both oxidizer
    'unlike-doublet': 90,    // Fuel meets oxidizer
    'triplet': 60,           // F-O-F pattern
    'pentad': 70,            // More complex
  };
  
  return angles[injectorType] || 60;
}

/**
 * PENETRATION DEPTH
 * How far spray penetrates into chamber
 * 
 * L_p ≈ C * D_o * (ρ_l/ρ_g)^0.5
 */
export function penetrationDepth(D_orifice, rho_l, rho_g, velocity) {
  const C = 8.0; // Empirical constant
  const L_p = C * D_orifice * Math.pow(rho_l / rho_g, 0.5);
  
  return L_p;
}

/**
 * ORIFICE DISCHARGE COEFFICIENT
 * Accounts for flow losses
 * 
 * Typical: Cd = 0.6-0.8 for sharp-edged orifices
 * Cd = 0.9-0.95 for rounded orifices
 */
export function dischargeCoefficient(orificeType = 'sharp') {
  const coefficients = {
    'sharp': 0.65,
    'rounded': 0.92,
    'streamlined': 0.98,
  };
  
  return coefficients[orificeType] || 0.7;
}

/**
 * COMPLETE INJECTOR ANALYZER
 */
export class InjectorAnalyzer {
  constructor(params) {
    this.injectorType = params.injectorType || 'unlike-doublet';
    this.numInjectors = params.numInjectors || 100;
    this.D_orifice = params.D_orifice || 0.001; // 1mm
    this.P_chamber = params.P_chamber;
    this.P_manifold = params.P_manifold;
    this.massFlowRate_total = params.massFlowRate_total;
    this.OF_ratio = params.OF_ratio || 3.5;
    
    // Fluid properties (methane/oxygen)
    this.rho_fuel = 422;      // CH4 liquid [kg/m³]
    this.rho_ox = 1140;       // O2 liquid [kg/m³]
    this.rho_gas = 5;         // Chamber gas [kg/m³]
    this.mu_fuel = 1.1e-4;    // Pa·s
    this.mu_ox = 2e-4;        // Pa·s
    this.sigma_fuel = 0.013;  // N/m
    this.sigma_ox = 0.013;    // N/m
    
    this.analyze();
  }
  
  analyze() {
    // 1. Pressure drop
    this.deltaP = this.P_manifold - this.P_chamber;
    
    // 2. Mass flow per injector
    const massFlow_perInjector = this.massFlowRate_total / this.numInjectors;
    
    // 3. Fuel and oxidizer flows
    this.massFlow_ox = massFlow_perInjector * (this.OF_ratio / (1 + this.OF_ratio));
    this.massFlow_fuel = massFlow_perInjector * (1 / (1 + this.OF_ratio));
    
    // 4. Orifice area
    const A_orifice = Math.PI * this.D_orifice * this.D_orifice / 4;
    
    // 5. Mass flux
    this.massFlux_ox = this.massFlow_ox / A_orifice;
    this.massFlux_fuel = this.massFlow_fuel / A_orifice;
    
    // 6. Injection velocity
    this.V_ox = this.massFlux_ox / this.rho_ox;
    this.V_fuel = this.massFlux_fuel / this.rho_fuel;
    
    // 7. Sauter Mean Diameter (SMD)
    this.SMD_ox = sauterMeanDiameter({
      sigma: this.sigma_ox,
      rho_l: this.rho_ox,
      rho_g: this.rho_gas,
      mu_l: this.mu_ox,
      deltaP: this.deltaP,
      massFlux: this.massFlux_ox,
    });
    
    this.SMD_fuel = sauterMeanDiameter({
      sigma: this.sigma_fuel,
      rho_l: this.rho_fuel,
      rho_g: this.rho_gas,
      mu_l: this.mu_fuel,
      deltaP: this.deltaP,
      massFlux: this.massFlux_fuel,
    });
    
    // 8. Weber number
    this.We_ox = weberNumber(this.rho_ox, this.V_ox, this.D_orifice, this.sigma_ox);
    this.We_fuel = weberNumber(this.rho_fuel, this.V_fuel, this.D_orifice, this.sigma_fuel);
    
    // 9. Ohnesorge number
    this.Oh_ox = ohnesorgeNumber(this.mu_ox, this.rho_ox, this.sigma_ox, this.D_orifice);
    this.Oh_fuel = ohnesorgeNumber(this.mu_fuel, this.rho_fuel, this.sigma_fuel, this.D_orifice);
    
    // 10. Breakup regime
    this.regime_ox = breakupRegime(this.We_ox, this.Oh_ox);
    this.regime_fuel = breakupRegime(this.We_fuel, this.Oh_fuel);
    
    // 11. Spray cone angle
    this.sprayAngle = sprayConeAngle(1, this.P_chamber, this.P_manifold);
    
    // 12. Atomization quality
    this.quality_ox = atomizationQuality(this.SMD_ox);
    this.quality_fuel = atomizationQuality(this.SMD_fuel);
    
    // 13. Mixing efficiency
    const turbIntensity = 0.08; // 8% typical
    this.eta_mix = mixingEfficiency(
      (this.SMD_ox + this.SMD_fuel) / 2,
      this.sprayAngle,
      (this.V_ox + this.V_fuel) / 2,
      turbIntensity
    );
    
    // 14. Penetration depth
    this.L_penetration = penetrationDepth(
      this.D_orifice,
      (this.rho_ox + this.rho_fuel) / 2,
      this.rho_gas,
      (this.V_ox + this.V_fuel) / 2
    );
    
    // 15. Impingement angle
    this.impingementAngle = impingementAngle(this.injectorType);
    
    // 16. Discharge coefficient
    this.Cd = dischargeCoefficient('rounded');
  }
  
  getResults() {
    return {
      deltaP: this.deltaP,
      massFlow_ox: this.massFlow_ox,
      massFlow_fuel: this.massFlow_fuel,
      V_ox: this.V_ox,
      V_fuel: this.V_fuel,
      SMD_ox: this.SMD_ox,
      SMD_fuel: this.SMD_fuel,
      We_ox: this.We_ox,
      We_fuel: this.We_fuel,
      Oh_ox: this.Oh_ox,
      Oh_fuel: this.Oh_fuel,
      regime_ox: this.regime_ox,
      regime_fuel: this.regime_fuel,
      sprayAngle: this.sprayAngle,
      quality_ox: this.quality_ox,
      quality_fuel: this.quality_fuel,
      eta_mix: this.eta_mix,
      L_penetration: this.L_penetration,
      impingementAngle: this.impingementAngle,
      Cd: this.Cd,
    };
  }
}

export default {
  sauterMeanDiameter,
  weberNumber,
  ohnesorgeNumber,
  breakupRegime,
  sprayConeAngle,
  atomizationQuality,
  mixingEfficiency,
  impingementAngle,
  penetrationDepth,
  dischargeCoefficient,
  InjectorAnalyzer,
};
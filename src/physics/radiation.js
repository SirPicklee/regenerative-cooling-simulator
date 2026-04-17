/**
 * RADIATION HEAT TRANSFER
 * Stefan-Boltzmann law, gas radiation, view factors
 */

import { CONSTANTS } from './constants';

/**
 * STEFAN-BOLTZMANN CONSTANT
 */
const SIGMA = CONSTANTS.STEFAN_BOLTZMANN; // 5.670374e-8 W/(m²·K⁴)

/**
 * EMISSIVITY DATABASE
 */
export const EMISSIVITY = {
  // Metals
  COPPER_POLISHED: 0.05,
  COPPER_OXIDIZED: 0.78,
  ALUMINUM_POLISHED: 0.04,
  STEEL_POLISHED: 0.07,
  STEEL_OXIDIZED: 0.79,
  
  // Combustion products (gases)
  CO2: 0.20,  // Carbon dioxide
  H2O: 0.30,  // Water vapor
  SOOT: 0.95, // Particulates
  
  // Combined combustion gas (CH4 + O2 → CO2 + H2O)
  COMBUSTION_GAS: 0.25, // Effective emissivity
};

/**
 * BLACKBODY RADIATION
 * Q = σ * A * T⁴
 */
export function blackbodyRadiation(T, area) {
  return SIGMA * area * Math.pow(T, 4);
}

/**
 * GRAY BODY RADIATION
 * Q = ε * σ * A * T⁴
 */
export function grayBodyRadiation(T, area, emissivity) {
  return emissivity * SIGMA * area * Math.pow(T, 4);
}

/**
 * NET RADIATION BETWEEN TWO SURFACES
 * Q_net = σ * A * (T1⁴ - T2⁴) / (1/ε1 + 1/ε2 - 1)
 * For parallel infinite plates or enclosed geometry
 */
export function netRadiationTwoSurfaces(T1, T2, area, emissivity1, emissivity2) {
  const T1_4 = Math.pow(T1, 4);
  const T2_4 = Math.pow(T2, 4);
  
  // Resistance terms
  const R1 = 1 / emissivity1;
  const R2 = 1 / emissivity2;
  const R_total = R1 + R2 - 1;
  
  return SIGMA * area * (T1_4 - T2_4) / R_total;
}

/**
 * RADIATION HEAT FLUX (per unit area)
 * q" = σ * (T1⁴ - T2⁴) / (1/ε1 + 1/ε2 - 1)
 */
export function radiationHeatFlux(T1, T2, emissivity1, emissivity2) {
  const T1_4 = Math.pow(T1, 4);
  const T2_4 = Math.pow(T2, 4);
  
  const R_total = (1 / emissivity1) + (1 / emissivity2) - 1;
  
  return SIGMA * (T1_4 - T2_4) / R_total;
}

/**
 * GAS RADIATION
 * For participating media (CO2, H2O in combustion products)
 * Using Hottel charts approximation
 */
export class GasRadiation {
  constructor(T_gas, P_gas, L_mean, composition = 'methane_combustion') {
    this.T_gas = T_gas;         // Gas temperature [K]
    this.P_gas = P_gas;         // Gas pressure [Pa]
    this.L_mean = L_mean;       // Mean beam length [m]
    this.composition = composition;
    
    this.calculate();
  }
  
  calculate() {
    // For CH4 + O2 combustion: CO2 + 2H2O
    // Partial pressures (simplified stoichiometry)
    const P_total = this.P_gas;
    const P_CO2 = P_total * 0.11;  // ~11% CO2
    const P_H2O = P_total * 0.22;  // ~22% H2O
    
    // Emissivity of CO2 (Hottel charts approximation)
    // ε_CO2 ≈ f(T, P_CO2 * L)
    const P_CO2_L = (P_CO2 / 101325) * this.L_mean; // atm·m
    this.epsilon_CO2 = this.getCO2Emissivity(this.T_gas, P_CO2_L);
    
    // Emissivity of H2O (Hottel charts approximation)
    const P_H2O_L = (P_H2O / 101325) * this.L_mean; // atm·m
    this.epsilon_H2O = this.getH2OEmissivity(this.T_gas, P_H2O_L);
    
    // Correction factor for band overlap
    const delta_epsilon = this.getBandOverlapCorrection(P_CO2_L, P_H2O_L);
    
    // Total gas emissivity
    this.epsilon_gas = this.epsilon_CO2 + this.epsilon_H2O - delta_epsilon;
    
    // Clamp to physical range
    this.epsilon_gas = Math.max(0.1, Math.min(0.9, this.epsilon_gas));
  }
  
  // Simplified CO2 emissivity (curve fit to Hottel charts)
  getCO2Emissivity(T, P_L) {
    // ε_CO2 increases with P*L, decreases with T
    const base = 0.12 * Math.log(1 + P_L);
    const temp_factor = 1200 / T; // Decreases with temperature
    return base * temp_factor;
  }
  
  // Simplified H2O emissivity
  getH2OEmissivity(T, P_L) {
    // ε_H2O increases with P*L, decreases with T
    const base = 0.18 * Math.log(1 + P_L);
    const temp_factor = 1400 / T;
    return base * temp_factor;
  }
  
  // Band overlap correction
  getBandOverlapCorrection(P_CO2_L, P_H2O_L) {
    // CO2 and H2O have overlapping absorption bands
    // Simplified correction
    return 0.02 * Math.sqrt(P_CO2_L * P_H2O_L);
  }
  
  // Gas radiation heat flux to a surface
  // q_rad = ε_gas * σ * (T_gas⁴ - T_surface⁴)
  getHeatFluxToSurface(T_surface) {
    const T_gas_4 = Math.pow(this.T_gas, 4);
    const T_surf_4 = Math.pow(T_surface, 4);
    
    return this.epsilon_gas * SIGMA * (T_gas_4 - T_surf_4);
  }
  
  getResults() {
    return {
      epsilon_CO2: this.epsilon_CO2,
      epsilon_H2O: this.epsilon_H2O,
      epsilon_gas: this.epsilon_gas,
    };
  }
}

/**
 * VIEW FACTOR CALCULATOR
 * Geometric configuration factors for radiation exchange
 */
export class ViewFactor {
  // View factor for concentric cylinders
  // F_1->2 for inner cylinder (1) to outer cylinder (2)
  static concentricCylinders(r1, r2, L) {
    // For very long cylinders (L >> r)
    // F_1->2 ≈ 1 (inner cylinder sees only outer cylinder)
    
    // More accurate formula:
    const R = r2 / r1;
    const X = 1 + (1 + R * R) / (2 * R);
    const F_12 = X - Math.sqrt(X * X - 1);
    
    return F_12;
  }
  
  // View factor for parallel coaxial disks
  static parallelDisks(r1, r2, h) {
    const R1 = r1 / h;
    const R2 = r2 / h;
    const S = 1 + (1 + R2 * R2) / (R1 * R1);
    
    const F_12 = 0.5 * (S - Math.sqrt(S * S - 4 * (R2 / R1) * (R2 / R1)));
    
    return F_12;
  }
  
  // For rocket chamber: approximate as cylinder
  static chamberGeometry(r_inner, r_outer, L) {
    return ViewFactor.concentricCylinders(r_inner, r_outer, L);
  }
}

/**
 * COMBINED CONVECTION + RADIATION
 * Total heat transfer at a surface
 */
export class CombinedHeatTransfer {
  constructor(params) {
    this.T_gas = params.T_gas;
    this.T_wall = params.T_wall;
    this.h_conv = params.h_conv;              // Convective heat transfer coefficient
    this.epsilon_gas = params.epsilon_gas;    // Gas emissivity
    this.epsilon_wall = params.epsilon_wall;  // Wall emissivity
    this.viewFactor = params.viewFactor || 1; // Default to full view
    
    this.calculate();
  }
  
  calculate() {
    // Convective heat flux
    this.q_conv = this.h_conv * (this.T_gas - this.T_wall);
    
    // Radiation heat flux
    // q_rad = F * ε_eff * σ * (T_gas⁴ - T_wall⁴)
    const epsilon_eff = 1 / (1/this.epsilon_gas + 1/this.epsilon_wall - 1);
    const T_gas_4 = Math.pow(this.T_gas, 4);
    const T_wall_4 = Math.pow(this.T_wall, 4);
    this.q_rad = this.viewFactor * epsilon_eff * SIGMA * (T_gas_4 - T_wall_4);
    
    // Total heat flux
    this.q_total = this.q_conv + this.q_rad;
    
    // Radiation fraction
    this.radiationFraction = this.q_rad / this.q_total;
    
    // Effective heat transfer coefficient (including radiation)
    this.h_total = this.q_total / (this.T_gas - this.T_wall);
  }
  
  getResults() {
    return {
      q_conv: this.q_conv,
      q_rad: this.q_rad,
      q_total: this.q_total,
      radiationFraction: this.radiationFraction,
      h_total: this.h_total,
    };
  }
}

/**
 * RADIATION SHIELD ANALYSIS
 * Multiple radiation shields (for insulation)
 */
export function radiationShields(T_hot, T_cold, n_shields, emissivity) {
  // With n shields, effective emissivity reduces
  const epsilon_eff = 1 / ((n_shields + 1) * (2/emissivity - 1));
  
  const q = SIGMA * epsilon_eff * (Math.pow(T_hot, 4) - Math.pow(T_cold, 4));
  
  return {
    q_flux: q,
    epsilon_effective: epsilon_eff,
    reduction_factor: emissivity / epsilon_eff,
  };
}

export default {
  SIGMA,
  EMISSIVITY,
  blackbodyRadiation,
  grayBodyRadiation,
  netRadiationTwoSurfaces,
  radiationHeatFlux,
  GasRadiation,
  ViewFactor,
  CombinedHeatTransfer,
  radiationShields,
};
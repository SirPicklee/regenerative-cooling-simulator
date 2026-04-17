/**
 * CHEMICAL KINETICS & COMBUSTION
 * Reaction rates, species concentration, equilibrium composition
 */

/**
 * ARRHENIUS EQUATION
 * k = A * exp(-E_a / (R * T))
 * Reaction rate constant
 */
export function arrheniusRate(A, Ea, T, R = 8.314) {
  return A * Math.exp(-Ea / (R * T));
}

/**
 * STOICHIOMETRIC COMBUSTION OF METHANE
 * CH4 + 2·O2 → CO2 + 2·H2O
 */
export const METHANE_COMBUSTION = {
  fuel: 'CH4',
  oxidizer: 'O2',
  stoichiometricRatio: 4.0, // kg O2 / kg CH4
  products: {
    CO2: 1,
    H2O: 2,
  },
  heatOfCombustion: 55.5e6, // J/kg (LHV - Lower Heating Value)
};

/**
 * MIXTURE RATIO
 * O/F = mass of oxidizer / mass of fuel
 */
export function mixtureRatio(m_oxidizer, m_fuel) {
  return m_oxidizer / m_fuel;
}

/**
 * EQUIVALENCE RATIO
 * φ = (F/O)_actual / (F/O)_stoichiometric
 * φ < 1: lean (excess oxidizer)
 * φ = 1: stoichiometric
 * φ > 1: rich (excess fuel)
 */
export function equivalenceRatio(OF_actual, OF_stoichiometric) {
  return OF_stoichiometric / OF_actual;
}

/**
 * ADIABATIC FLAME TEMPERATURE
 * Simplified calculation for methane-oxygen combustion
 */
export function adiabaticFlameTemperature(OF_ratio, T_initial = 298) {
  const OF_stoich = METHANE_COMBUSTION.stoichiometricRatio;
  const phi = equivalenceRatio(OF_ratio, OF_stoich);
  
  // Simplified correlation
  // Maximum temperature at stoichiometric (φ = 1)
  const T_max = 3500; // K (for CH4-O2)
  
  let T_flame;
  if (phi <= 1.0) {
    // Lean mixture (excess O2)
    T_flame = T_initial + (T_max - T_initial) * phi;
  } else {
    // Rich mixture (excess CH4)
    const richness = phi - 1.0;
    T_flame = T_max - (T_max - T_initial) * richness * 0.5;
  }
  
  return Math.max(T_initial, Math.min(T_max, T_flame));
}

/**
 * SPECIES CONCENTRATION (Mole Fractions)
 * Simplified equilibrium for CH4 + O2 combustion
 */
export class SpeciesConcentration {
  constructor(OF_ratio, P_chamber, T_chamber) {
    this.OF = OF_ratio;
    this.P = P_chamber;
    this.T = T_chamber;
    
    this.calculate();
  }
  
  calculate() {
    const OF_stoich = METHANE_COMBUSTION.stoichiometricRatio;
    const phi = equivalenceRatio(this.OF, OF_stoich);
    
    // Simplified species distribution
    // For stoichiometric: CH4 + 2O2 → CO2 + 2H2O
    
    if (Math.abs(phi - 1.0) < 0.1) {
      // Near stoichiometric
      this.X_CO2 = 0.33;
      this.X_H2O = 0.67;
      this.X_O2 = 0.0;
      this.X_CH4 = 0.0;
      this.X_CO = 0.0;
      this.X_H2 = 0.0;
    } else if (phi < 1.0) {
      // Lean (excess O2)
      const excess_O2 = (1.0 - phi) * 0.5;
      this.X_CO2 = 0.30;
      this.X_H2O = 0.60;
      this.X_O2 = excess_O2;
      this.X_CH4 = 0.0;
      this.X_CO = 0.02;
      this.X_H2 = 0.01;
    } else {
      // Rich (excess CH4)
      const excess_fuel = (phi - 1.0) * 0.3;
      this.X_CO2 = 0.25;
      this.X_H2O = 0.50;
      this.X_O2 = 0.0;
      this.X_CH4 = excess_fuel;
      this.X_CO = 0.15;
      this.X_H2 = 0.10;
    }
    
    // Normalize
    const total = this.X_CO2 + this.X_H2O + this.X_O2 + this.X_CH4 + this.X_CO + this.X_H2;
    this.X_CO2 /= total;
    this.X_H2O /= total;
    this.X_O2 /= total;
    this.X_CH4 /= total;
    this.X_CO /= total;
    this.X_H2 /= total;
  }
  
  getResults() {
    return {
      X_CO2: this.X_CO2,
      X_H2O: this.X_H2O,
      X_O2: this.X_O2,
      X_CH4: this.X_CH4,
      X_CO: this.X_CO,
      X_H2: this.X_H2,
    };
  }
}

/**
 * COMBUSTION EFFICIENCY
 * η_c = (Actual heat release) / (Theoretical heat release)
 */
export function combustionEfficiency(T_actual, T_adiabatic, T_initial = 298) {
  return (T_actual - T_initial) / (T_adiabatic - T_initial);
}

/**
 * REACTION RATE (Simplified Global Kinetics)
 * For CH4 + O2 combustion
 * Rate ∝ [CH4]^a * [O2]^b * exp(-Ea/RT)
 */
export class GlobalReactionRate {
  constructor(params) {
    this.X_CH4 = params.X_CH4;
    this.X_O2 = params.X_O2;
    this.P = params.P;           // Pa
    this.T = params.T;           // K
    
    // Arrhenius parameters (simplified)
    this.A = 2.0e11;             // Pre-exponential factor
    this.Ea = 200e3;             // Activation energy [J/mol]
    this.a = 0.5;                // CH4 order
    this.b = 1.0;                // O2 order
    
    this.calculate();
  }
  
  calculate() {
    const R = 8.314; // J/(mol·K)
    
    // Arrhenius rate constant
    const k = arrheniusRate(this.A, this.Ea, this.T, R);
    
    // Concentrations (simplified from mole fractions)
    const C_CH4 = this.X_CH4 * this.P / (R * this.T);
    const C_O2 = this.X_O2 * this.P / (R * this.T);
    
    // Reaction rate
    this.rate = k * Math.pow(C_CH4, this.a) * Math.pow(C_O2, this.b);
    
    // Characteristic time (inverse of rate)
    this.tau_chem = 1.0 / (this.rate + 1e-10); // Avoid division by zero
  }
  
  getResults() {
    return {
      rate: this.rate,
      tau_chem: this.tau_chem,
      k: arrheniusRate(this.A, this.Ea, this.T),
    };
  }
}

/**
 * DAMKÖHLER NUMBER
 * Da = τ_flow / τ_chem
 * Da >> 1: Reaction fast, mixing limited
 * Da << 1: Reaction slow, kinetics limited
 */
export function damkohlerNumber(tau_flow, tau_chem) {
  return tau_flow / tau_chem;
}

/**
 * MOLECULAR WEIGHT OF MIXTURE
 */
export const MOLECULAR_WEIGHTS = {
  CH4: 16.04,    // g/mol
  O2: 32.00,
  CO2: 44.01,
  H2O: 18.02,
  CO: 28.01,
  H2: 2.02,
  N2: 28.01,
};

export function mixtureMolecularWeight(species) {
  let MW_mix = 0;
  for (const [name, X] of Object.entries(species)) {
    MW_mix += X * MOLECULAR_WEIGHTS[name];
  }
  return MW_mix;
}

/**
 * SPECIFIC HEAT RATIO (γ)
 * Temperature-dependent for combustion products
 */
export function specificHeatRatio(T, species) {
  // Simplified correlation
  // γ decreases with temperature
  const gamma_300K = 1.40;
  const gamma_3000K = 1.20;
  
  const T_ref = 300;
  const T_max = 3000;
  
  const fraction = Math.min(1, Math.max(0, (T - T_ref) / (T_max - T_ref)));
  
  return gamma_300K - (gamma_300K - gamma_3000K) * fraction;
}

/**
 * COMPLETE COMBUSTION ANALYZER
 */
export class CombustionAnalyzer {
  constructor(params) {
    this.massFlowRate_fuel = params.massFlowRate_fuel;     // kg/s
    this.massFlowRate_oxidizer = params.massFlowRate_oxidizer; // kg/s
    this.P_chamber = params.P_chamber;                     // Pa
    this.T_chamber = params.T_chamber;                     // K
    this.T_injector = params.T_injector || 298;            // K
    
    this.analyze();
  }
  
  analyze() {
    // 1. Mixture ratio
    this.OF = mixtureRatio(this.massFlowRate_oxidizer, this.massFlowRate_fuel);
    
    // 2. Equivalence ratio
    const OF_stoich = METHANE_COMBUSTION.stoichiometricRatio;
    this.phi = equivalenceRatio(this.OF, OF_stoich);
    
    // 3. Adiabatic flame temperature
    this.T_adiabatic = adiabaticFlameTemperature(this.OF, this.T_injector);
    
    // 4. Combustion efficiency
    this.eta_combustion = combustionEfficiency(this.T_chamber, this.T_adiabatic, this.T_injector);
    
    // 5. Species concentration
    const species = new SpeciesConcentration(this.OF, this.P_chamber, this.T_chamber);
    this.species = species.getResults();
    
    // 6. Mixture molecular weight
    this.MW_mix = mixtureMolecularWeight(this.species);
    
    // 7. Specific heat ratio
    this.gamma = specificHeatRatio(this.T_chamber, this.species);
    
    // 8. Reaction rate
    const reaction = new GlobalReactionRate({
      X_CH4: this.species.X_CH4,
      X_O2: this.species.X_O2,
      P: this.P_chamber,
      T: this.T_chamber,
    });
    this.reactionRate = reaction.getResults();
    
    // 9. Heat release
    const totalMassFlow = this.massFlowRate_fuel + this.massFlowRate_oxidizer;
    this.heatRelease = this.massFlowRate_fuel * METHANE_COMBUSTION.heatOfCombustion * this.eta_combustion;
    
    // 10. Mixture classification
    if (this.phi < 0.9) {
      this.mixtureType = 'lean';
    } else if (this.phi > 1.1) {
      this.mixtureType = 'rich';
    } else {
      this.mixtureType = 'stoichiometric';
    }
  }
  
  getResults() {
    return {
      OF: this.OF,
      phi: this.phi,
      T_adiabatic: this.T_adiabatic,
      eta_combustion: this.eta_combustion,
      species: this.species,
      MW_mix: this.MW_mix,
      gamma: this.gamma,
      reactionRate: this.reactionRate,
      heatRelease: this.heatRelease,
      mixtureType: this.mixtureType,
    };
  }
}

export default {
  arrheniusRate,
  METHANE_COMBUSTION,
  mixtureRatio,
  equivalenceRatio,
  adiabaticFlameTemperature,
  SpeciesConcentration,
  combustionEfficiency,
  GlobalReactionRate,
  damkohlerNumber,
  MOLECULAR_WEIGHTS,
  mixtureMolecularWeight,
  specificHeatRatio,
  CombustionAnalyzer,
};
/**
 * MATERIAL PROPERTIES DATABASE
 * Temperature-dependent properties for regenerative cooling simulation
 */

/**
 * COPPER ALLOY (C18150 - Chromium Copper)
 * Used in SpaceX Raptor combustion chamber walls
 */
export const COPPER_WALL = {
  name: 'Chromium Copper C18150',

  // Thermal conductivity [W/(m·K)] - temperature dependent
  thermalConductivity: (T) => {
    // Empirical correlation for Cu alloy
    // k decreases with temperature
    const k_20C = 330;  // W/(m·K) at 20°C
    const k_300C = 320; // W/(m·K) at 300°C
    const k_500C = 310; // W/(m·K) at 500°C

    // Linear interpolation (simplified)
    if (T < 293) return k_20C;
    if (T < 573) return k_20C - (k_20C - k_300C) * (T - 293) / (573 - 293);
    if (T < 773) return k_300C - (k_300C - k_500C) * (T - 573) / (773 - 573);
    return k_500C;
  },

  // Density [kg/m³]
  density: 8900,

  // Specific heat [J/(kg·K)]
  specificHeat: (T) => {
    // Cp increases slightly with temperature
    return 385 + 0.05 * (T - 300);
  },

  // Thermal diffusivity [m²/s]
  // α = k / (ρ * Cp)
  thermalDiffusivity: function (T) {
    const k = this.thermalConductivity(T);
    const cp = this.specificHeat(T);
    return k / (this.density * cp);
  },

  // Emissivity (for radiation)
  emissivity: 0.05, // Polished copper

  // Melting point [K]
  meltingPoint: 1358,

  // Yield strength [Pa] - decreases with temperature
  yieldStrength: (T) => {
    const sigma_20C = 450e6;  // 450 MPa at room temp
    const sigma_300C = 350e6; // Decreases at high temp
    if (T < 293) return sigma_20C;
    if (T < 573) return sigma_20C - (sigma_20C - sigma_300C) * (T - 293) / (573 - 293);
    return sigma_300C;
  },
};

/**
 * LIQUID METHANE (CH4) - Coolant/Fuel
 * Primary coolant in SpaceX Raptor
 */
export const METHANE = {
  name: 'Liquid Methane',
  molecularWeight: 16.04, // kg/kmol

  // Density [kg/m³] - strongly temperature dependent
  density: (T, P = 30e6) => {
    // Simplified NIST correlation for liquid CH4
    // At 30 MPa (300 bar)
    if (T < 111) return 450; // Subcooled liquid
    if (T < 190) {
      // Linear approximation in liquid range
      return 450 - (450 - 300) * (T - 111) / (190 - 111);
    }
    // Supercritical region - density continues to decrease
    return 300 * Math.exp(-0.005 * (T - 190));
  },

  // Specific heat [J/(kg·K)]
  specificHeat: (T, P = 30e6) => {
    // Cp increases near critical point
    const T_critical = 190.6; // K
    const factor = Math.exp(-Math.pow((T - T_critical) / 50, 2));
    return 3000 + 2000 * factor; // Peak near critical point
  },

  // Thermal conductivity [W/(m·K)]
  thermalConductivity: (T) => {
    // Liquid CH4 thermal conductivity
    if (T < 111) return 0.20;
    if (T < 190) {
      return 0.20 - (0.20 - 0.10) * (T - 111) / (190 - 111);
    }
    return 0.10; // Supercritical
  },

  // Dynamic viscosity [Pa·s]
  viscosity: (T) => {
    // Decreases with temperature
    if (T < 111) return 1.5e-4;
    if (T < 190) {
      return 1.5e-4 * Math.exp(-0.015 * (T - 111));
    }
    return 3e-5; // Supercritical - very low viscosity
  },

  // Prandtl number
  prandtl: function (T, P = 30e6) {
    const mu = this.viscosity(T);
    const cp = this.specificHeat(T, P);
    const k = this.thermalConductivity(T);
    return (mu * cp) / k;
  },

  // Critical properties
  T_critical: 190.6,  // K
  P_critical: 4.599e6, // Pa

  // Saturation properties (simplified)
  saturationTemp: (P) => {
    // Antoine equation approximation
    return 111 + 50 * Math.log(P / 101325);
  },
};

/**
 * COMBUSTION PRODUCTS (Approximation)
 * CH4 + O2 → CO2 + H2O at stoichiometric ratio
 */
export const COMBUSTION_GAS = {
  name: 'Hot Combustion Products',

  // Average molecular weight [kg/kmol]
  molecularWeight: 25, // Mixture of CO2, H2O, etc.

  // Specific heat ratio
  gamma: 1.25,

  // Specific heat at constant pressure [J/(kg·K)]
  specificHeat: (T) => {
    // Increases slightly with temperature
    return 1200 + 0.3 * (T - 1000);
  },

  // Thermal conductivity [W/(m·K)]
  thermalConductivity: (T) => {
    // High-temperature gas
    return 0.05 + 0.0001 * (T - 1000);
  },

  // Dynamic viscosity [Pa·s]
  viscosity: (T) => {
    // Sutherland's formula for high-temp gases
    const T_ref = 300;
    const mu_ref = 1.8e-5;
    const S = 110;
    return mu_ref * Math.pow(T / T_ref, 1.5) * (T_ref + S) / (T + S);
  },

  // Prandtl number (approximately constant for gases)
  prandtl: 0.75,

  // Density from ideal gas law
  density: (T, P) => {
    const R_specific = 8314.46 / 25; // J/(kg·K) - using molecularWeight = 25
    return P / (R_specific * T);
  },
};

/**
 * MATERIAL DATABASE
 */
export const MATERIALS = {
  wall: COPPER_WALL,
  coolant: METHANE,
  hotGas: COMBUSTION_GAS,
};

/**
 * BOUNDARY LAYER PARAMETERS
 */
export const BOUNDARY_LAYER = {
  // Recovery factor for high-speed flow
  recoveryFactor: (Pr) => Math.pow(Pr, 1 / 3),

  // Adiabatic wall temperature
  // T_aw = T_∞ * (1 + r * (γ-1)/2 * M²)
  adiabaticWallTemp: (T_freestream, Mach, gamma, Pr) => {
    const r = Math.pow(Pr, 1 / 3); // Recovery factor
    return T_freestream * (1 + r * (gamma - 1) / 2 * Mach * Mach);
  },

  // Film coefficient for turbulent boundary layer
  // Using Reynolds analogy
  filmCoefficient: (rho, velocity, cp, Re, Pr) => {
    // Stanton number: St = 0.023 * Re^(-0.2) * Pr^(-0.6)
    const St = 0.023 * Math.pow(Re, -0.2) * Math.pow(Pr, -0.6);
    return St * rho * velocity * cp;
  },
};

/**
 * HELPER FUNCTIONS
 */
export const MaterialHelpers = {
  // Get all properties at given state
  getCoolantProperties: (T, P = 30e6) => ({
    rho: METHANE.density(T, P),
    cp: METHANE.specificHeat(T, P),
    k: METHANE.thermalConductivity(T),
    mu: METHANE.viscosity(T),
    Pr: METHANE.prandtl(T, P),
  }),

  getWallProperties: (T) => ({
    k: COPPER_WALL.thermalConductivity(T),
    rho: COPPER_WALL.density,
    cp: COPPER_WALL.specificHeat(T),
    alpha: COPPER_WALL.thermalDiffusivity(T),
  }),

  getGasProperties: (T, P) => ({
    rho: COMBUSTION_GAS.density(T, P),
    cp: COMBUSTION_GAS.specificHeat(T),
    k: COMBUSTION_GAS.thermalConductivity(T),
    mu: COMBUSTION_GAS.viscosity(T),
    Pr: COMBUSTION_GAS.prandtl,
  }),
};

export default MATERIALS;
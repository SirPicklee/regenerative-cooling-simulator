/**
 * PHYSICAL CONSTANTS
 * SI units throughout unless noted
 */

export const CONSTANTS = {
  // Universal Constants
  R_UNIVERSAL: 8314.46,           // J/(kmol·K) - Universal gas constant
  STEFAN_BOLTZMANN: 5.670374e-8,  // W/(m²·K⁴) - Stefan-Boltzmann constant
  G: 9.81,                        // m/s² - Gravitational acceleration
  
  // Reference Conditions
  P_ATM: 101325,                  // Pa - Atmospheric pressure
  T_STANDARD: 288.15,             // K - Standard temperature (15°C)
  
  // Combustion Properties
  CHAMBER_PRESSURE: 30e6,         // Pa (300 bar) - Similar to Raptor
  CHAMBER_TEMP: 3500,             // K - Combustion temperature
  THROAT_PRESSURE_RATIO: 0.58,    // Critical pressure ratio for choked flow
  
  // Geometry (Raptor-inspired values)
  CHAMBER_DIAMETER: 0.3,          // m
  THROAT_DIAMETER: 0.15,          // m  
  NOZZLE_EXIT_DIAMETER: 0.5,      // m
  CHAMBER_LENGTH: 0.5,            // m
  NOZZLE_LENGTH: 0.8,             // m
  
  // Cooling Channel Geometry
  CHANNEL_WIDTH: 0.002,           // m (2mm)
  CHANNEL_HEIGHT: 0.003,          // m (3mm)
  CHANNEL_COUNT: 360,             // Number of channels around circumference
  WALL_THICKNESS: 0.001,          // m (1mm copper wall)
};

/**
 * UNIT CONVERSION UTILITIES
 */
export const UNITS = {
  // Temperature
  kelvinToCelsius: (K) => K - 273.15,
  celsiusToKelvin: (C) => C + 273.15,
  kelvinToFahrenheit: (K) => (K - 273.15) * 9/5 + 32,
  
  // Pressure
  paToBar: (Pa) => Pa / 1e5,
  barToPa: (bar) => bar * 1e5,
  paToMPa: (Pa) => Pa / 1e6,
  paToPsi: (Pa) => Pa / 6894.76,
  
  // Power/Heat Flux
  wattToMW: (W) => W / 1e6,
  heatFluxToMW: (qFlux) => qFlux / 1e6, // W/m² to MW/m²
  
  // Mass Flow
  kgPerSecToTonPerHour: (kgs) => kgs * 3.6,
};

/**
 * DIMENSIONAL ANALYSIS HELPERS
 */
export const DIMENSIONLESS = {
  // Reynolds Number: Re = ρVD/μ
  reynolds: (rho, velocity, diameter, mu) => {
    return (rho * velocity * diameter) / mu;
  },
  
  // Prandtl Number: Pr = μCp/k
  prandtl: (mu, cp, k) => {
    return (mu * cp) / k;
  },
  
  // Nusselt Number (Dittus-Boelter for turbulent flow)
  // Nu = 0.023 * Re^0.8 * Pr^0.4
  nusseltDittusBoelter: (Re, Pr, heating = true) => {
    const exponent = heating ? 0.4 : 0.3;
    return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, exponent);
  },
  
  // Heat transfer coefficient from Nusselt
  // h = Nu * k / D
  heatTransferCoeff: (Nu, k, D) => {
    return (Nu * k) / D;
  },
};

/**
 * MESH PARAMETERS
 */
export const MESH_CONFIG = {
  // Axial discretization
  NX_CHAMBER: 20,      // Nodes in combustion chamber
  NX_THROAT: 10,       // Extra nodes near throat (critical region)
  NX_NOZZLE: 30,       // Nodes in nozzle
  
  // Radial discretization  
  NR_WALL: 5,          // Nodes through wall thickness
  NR_COOLANT: 3,       // Nodes through coolant channel
  
  // Time stepping
  DT: 0.001,           // s - Time step for transient
  MAX_ITERATIONS: 1000, // Max iterations for steady-state
  TOLERANCE: 1e-6,     // Convergence tolerance
};

/**
 * NUMERICAL METHODS CONFIG
 */
export const SOLVER_CONFIG = {
  // Relaxation factors for stability
  ALPHA_THERMAL: 0.5,   // Under-relaxation for temperature
  ALPHA_PRESSURE: 0.3,  // Under-relaxation for pressure
  ALPHA_VELOCITY: 0.7,  // Under-relaxation for velocity
  
  // Convergence criteria
  RESIDUAL_TARGET: 1e-5,
  MAX_INNER_ITERATIONS: 50,
};

export default {
  CONSTANTS,
  UNITS,
  DIMENSIONLESS,
  MESH_CONFIG,
  SOLVER_CONFIG,
};
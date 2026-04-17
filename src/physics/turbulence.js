/**
 * TURBULENCE MODELING
 * k-epsilon model for Reynolds-Averaged Navier-Stokes (RANS)
 */

/**
 * k-epsilon MODEL CONSTANTS
 * Standard k-epsilon model (Launder-Sharma)
 */
export const K_EPSILON_CONSTANTS = {
  C_mu: 0.09,      // Turbulent viscosity constant
  C_1e: 1.44,      // Epsilon equation constant
  C_2e: 1.92,      // Epsilon equation constant
  sigma_k: 1.0,    // Turbulent Prandtl number for k
  sigma_e: 1.3,    // Turbulent Prandtl number for epsilon
  kappa: 0.41,     // von Kármán constant
  E: 9.8,          // Wall function constant
};

/**
 * TURBULENT KINETIC ENERGY (k)
 * k = 0.5 * <u'² + v'² + w'²>
 * Unit: m²/s²
 */
export function turbulentKineticEnergy(U_mean, turbulenceIntensity) {
  // k = 1.5 * (U * I)²
  // where I is turbulence intensity (typically 1-10%)
  const I = turbulenceIntensity / 100; // Convert percentage to fraction
  return 1.5 * Math.pow(U_mean * I, 2);
}

/**
 * TURBULENT DISSIPATION RATE (epsilon)
 * ε = C_mu^(3/4) * k^(3/2) / L_t
 * Unit: m²/s³
 */
export function turbulentDissipationRate(k, L_t) {
  const C_mu = K_EPSILON_CONSTANTS.C_mu;
  return Math.pow(C_mu, 0.75) * Math.pow(k, 1.5) / L_t;
}

/**
 * TURBULENT LENGTH SCALE
 * L_t = 0.07 * L_ref
 * where L_ref is characteristic length (e.g., pipe diameter)
 */
export function turbulentLengthScale(L_ref) {
  return 0.07 * L_ref;
}

/**
 * TURBULENT TIME SCALE
 * τ_t = k / ε
 */
export function turbulentTimeScale(k, epsilon) {
  return k / epsilon;
}

/**
 * EDDY VISCOSITY (Turbulent Viscosity)
 * μ_t = ρ * C_mu * k² / ε
 * Unit: Pa·s
 */
export function eddyViscosity(rho, k, epsilon) {
  const C_mu = K_EPSILON_CONSTANTS.C_mu;
  return rho * C_mu * (k * k) / epsilon;
}

/**
 * EFFECTIVE VISCOSITY
 * μ_eff = μ + μ_t
 */
export function effectiveViscosity(mu_laminar, mu_turbulent) {
  return mu_laminar + mu_turbulent;
}

/**
 * TURBULENT PRANDTL NUMBER
 * Pr_t = μ_t * c_p / k_t
 * Typically Pr_t ≈ 0.85-0.9 for most flows
 */
export const TURBULENT_PRANDTL = 0.85;

/**
 * TURBULENT THERMAL CONDUCTIVITY
 * k_t = μ_t * c_p / Pr_t
 */
export function turbulentThermalConductivity(mu_t, cp) {
  return mu_t * cp / TURBULENT_PRANDTL;
}

/**
 * EFFECTIVE THERMAL CONDUCTIVITY
 * k_eff = k_laminar + k_turbulent
 */
export function effectiveThermalConductivity(k_laminar, k_turbulent) {
  return k_laminar + k_turbulent;
}

/**
 * WALL FUNCTIONS
 * For y+ > 30 (log-layer)
 */
export class WallFunctions {
  constructor(y_plus, u_tau, rho, mu) {
    this.y_plus = y_plus;
    this.u_tau = u_tau;
    this.rho = rho;
    this.mu = mu;
    
    this.kappa = K_EPSILON_CONSTANTS.kappa;
    this.E = K_EPSILON_CONSTANTS.E;
    this.C_mu = K_EPSILON_CONSTANTS.C_mu;
    
    this.calculate();
  }
  
  calculate() {
    if (this.y_plus < 11.225) {
      // Viscous sublayer: u+ = y+
      this.u_plus = this.y_plus;
      this.regime = 'viscous';
    } else {
      // Log-layer: u+ = (1/κ) * ln(E * y+)
      this.u_plus = (1 / this.kappa) * Math.log(this.E * this.y_plus);
      this.regime = 'log-layer';
    }
    
    // Turbulent kinetic energy at wall
    // k_wall = u_τ² / sqrt(C_mu)
    this.k_wall = (this.u_tau * this.u_tau) / Math.sqrt(this.C_mu);
    
    // Dissipation rate at wall
    // ε_wall = u_τ³ / (κ * y)
    const y = (this.y_plus * this.mu) / (this.rho * this.u_tau);
    this.epsilon_wall = Math.pow(this.u_tau, 3) / (this.kappa * y);
    
    // Turbulent viscosity at wall
    this.mu_t_wall = this.rho * this.C_mu * (this.k_wall * this.k_wall) / this.epsilon_wall;
  }
  
  getResults() {
    return {
      regime: this.regime,
      u_plus: this.u_plus,
      y_plus: this.y_plus,
      k_wall: this.k_wall,
      epsilon_wall: this.epsilon_wall,
      mu_t_wall: this.mu_t_wall,
    };
  }
}

/**
 * K-EPSILON TURBULENCE MODEL
 * Complete implementation for turbulent flow analysis
 */
export class KEpsilonModel {
  constructor(params) {
    this.U_mean = params.U_mean;           // Mean velocity [m/s]
    this.L_ref = params.L_ref;             // Reference length [m]
    this.rho = params.rho;                 // Density [kg/m³]
    this.mu = params.mu;                   // Laminar viscosity [Pa·s]
    this.cp = params.cp;                   // Specific heat [J/(kg·K)]
    this.k_laminar = params.k_laminar;     // Laminar thermal conductivity [W/(m·K)]
    this.turbIntensity = params.turbIntensity || 5; // Turbulence intensity [%]
    this.y_wall = params.y_wall || 0.001;  // Distance from wall [m]
    
    this.solve();
  }
  
  solve() {
    // Step 1: Calculate turbulent kinetic energy
    this.k = turbulentKineticEnergy(this.U_mean, this.turbIntensity);
    
    // Step 2: Calculate turbulent length scale
    this.L_t = turbulentLengthScale(this.L_ref);
    
    // Step 3: Calculate dissipation rate
    this.epsilon = turbulentDissipationRate(this.k, this.L_t);
    
    // Step 4: Calculate eddy viscosity
    this.mu_t = eddyViscosity(this.rho, this.k, this.epsilon);
    
    // Step 5: Effective viscosity
    this.mu_eff = effectiveViscosity(this.mu, this.mu_t);
    
    // Step 6: Turbulent thermal conductivity
    this.k_t = turbulentThermalConductivity(this.mu_t, this.cp);
    
    // Step 7: Effective thermal conductivity
    this.k_eff = effectiveThermalConductivity(this.k_laminar, this.k_t);
    
    // Step 8: Turbulent time scale
    this.tau_t = turbulentTimeScale(this.k, this.epsilon);
    
    // Step 9: Turbulent Reynolds number
    this.Re_t = (this.rho * this.k * this.k) / (this.mu * this.epsilon);
    
    // Step 10: Kolmogorov scales (smallest turbulent eddies)
    this.eta = Math.pow((this.mu / this.rho) ** 3 / this.epsilon, 0.25); // Length scale
    this.tau_eta = Math.sqrt((this.mu / this.rho) / this.epsilon); // Time scale
    this.u_eta = Math.pow(this.mu * this.epsilon / this.rho, 0.25); // Velocity scale
    
    // Step 11: Integral length scale (largest eddies)
    this.L_integral = Math.pow(this.k, 1.5) / this.epsilon;
    
    // Step 12: Viscosity ratio
    this.viscosityRatio = this.mu_t / this.mu;
    
    // Step 13: Wall analysis
    const Re = (this.rho * this.U_mean * this.L_ref) / this.mu;
    const Cf_approx = 0.0592 / Math.pow(Re, 0.2); // Approximate for turbulent
    const tau_w = 0.5 * this.rho * this.U_mean * this.U_mean * Cf_approx;
    const u_tau = Math.sqrt(tau_w / this.rho);
    const y_plus = (this.rho * u_tau * this.y_wall) / this.mu;
    
    this.wallFunc = new WallFunctions(y_plus, u_tau, this.rho, this.mu);
    this.wallResults = this.wallFunc.getResults();
  }
  
  getResults() {
    return {
      // Turbulent quantities
      k: this.k,
      epsilon: this.epsilon,
      mu_t: this.mu_t,
      mu_eff: this.mu_eff,
      k_t: this.k_t,
      k_eff: this.k_eff,
      
      // Time and length scales
      tau_t: this.tau_t,
      L_t: this.L_t,
      L_integral: this.L_integral,
      
      // Kolmogorov scales
      eta: this.eta,
      tau_eta: this.tau_eta,
      u_eta: this.u_eta,
      
      // Dimensionless
      Re_t: this.Re_t,
      viscosityRatio: this.viscosityRatio,
      turbIntensity: this.turbIntensity,
      
      // Wall properties
      wall: this.wallResults,
    };
  }
  
  // Get turbulence model constants
  static getConstants() {
    return K_EPSILON_CONSTANTS;
  }
}

/**
 * TURBULENCE INTENSITY ESTIMATOR
 * Based on Reynolds number
 */
export function estimateTurbulenceIntensity(Re) {
  // Empirical correlation
  // I ≈ 0.16 * Re^(-1/8)
  return 0.16 * Math.pow(Re, -0.125) * 100; // Return as percentage
}

/**
 * PRODUCTION OF TURBULENT KINETIC ENERGY
 * P_k = μ_t * (∂U/∂y)²
 */
export function turbulentProduction(mu_t, velocity_gradient) {
  return mu_t * velocity_gradient * velocity_gradient;
}

/**
 * TURBULENT HEAT FLUX
 * q_t = -k_t * ∇T = -(μ_t * c_p / Pr_t) * ∇T
 */
export function turbulentHeatFlux(mu_t, cp, temp_gradient) {
  const k_t = turbulentThermalConductivity(mu_t, cp);
  return -k_t * temp_gradient;
}

export default {
  K_EPSILON_CONSTANTS,
  turbulentKineticEnergy,
  turbulentDissipationRate,
  turbulentLengthScale,
  turbulentTimeScale,
  eddyViscosity,
  effectiveViscosity,
  TURBULENT_PRANDTL,
  turbulentThermalConductivity,
  effectiveThermalConductivity,
  WallFunctions,
  KEpsilonModel,
  estimateTurbulenceIntensity,
  turbulentProduction,
  turbulentHeatFlux,
};
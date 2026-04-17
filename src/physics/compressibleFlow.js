/**
 * COMPRESSIBLE FLOW ANALYSIS
 * Supersonic flow, shock waves, isentropic relations
 */

/**
 * ISENTROPIC FLOW RELATIONS
 * For ideal gas with constant specific heats
 */

/**
 * TEMPERATURE RATIO (Isentropic)
 * T/T_0 = 1 / (1 + (γ-1)/2 * M²)
 */
export function isentropicTemperatureRatio(M, gamma = 1.25) {
  return 1.0 / (1.0 + ((gamma - 1.0) / 2.0) * M * M);
}

/**
 * PRESSURE RATIO (Isentropic)
 * P/P_0 = (T/T_0)^(γ/(γ-1))
 */
export function isentropicPressureRatio(M, gamma = 1.25) {
  const T_ratio = isentropicTemperatureRatio(M, gamma);
  return Math.pow(T_ratio, gamma / (gamma - 1.0));
}

/**
 * DENSITY RATIO (Isentropic)
 * ρ/ρ_0 = (T/T_0)^(1/(γ-1))
 */
export function isentropicDensityRatio(M, gamma = 1.25) {
  const T_ratio = isentropicTemperatureRatio(M, gamma);
  return Math.pow(T_ratio, 1.0 / (gamma - 1.0));
}

/**
 * AREA RATIO (Isentropic)
 * A/A* = (1/M) * [(2/(γ+1)) * (1 + (γ-1)/2 * M²)]^((γ+1)/(2(γ-1)))
 */
export function isentropicAreaRatio(M, gamma = 1.25) {
  const term1 = 1.0 / M;
  const term2 = 2.0 / (gamma + 1.0);
  const term3 = 1.0 + ((gamma - 1.0) / 2.0) * M * M;
  const exponent = (gamma + 1.0) / (2.0 * (gamma - 1.0));
  
  return term1 * Math.pow(term2 * term3, exponent);
}

/**
 * MACH NUMBER FROM AREA RATIO
 * Iterative solution (Newton-Raphson)
 */
export function machFromAreaRatio(areaRatio, gamma = 1.25, subsonic = false) {
  // Initial guess
  let M = subsonic ? 0.5 : 2.0;
  
  // Newton-Raphson iteration
  for (let i = 0; i < 20; i++) {
    const A_ratio = isentropicAreaRatio(M, gamma);
    const error = A_ratio - areaRatio;
    
    if (Math.abs(error) < 1e-6) break;
    
    // Derivative dA/dM (numerical)
    const dM = 0.0001;
    const A_plus = isentropicAreaRatio(M + dM, gamma);
    const dA_dM = (A_plus - A_ratio) / dM;
    
    M = M - error / dA_dM;
    
    // Keep M positive
    if (M < 0.01) M = 0.01;
  }
  
  return M;
}

/**
 * NORMAL SHOCK RELATIONS
 * For sudden deceleration in supersonic flow
 */
export class NormalShock {
  constructor(M1, gamma = 1.25) {
    this.M1 = M1; // Upstream Mach number
    this.gamma = gamma;
    
    if (M1 < 1.0) {
      throw new Error('Normal shock requires supersonic flow (M > 1)');
    }
    
    this.calculate();
  }
  
  calculate() {
    const M1 = this.M1;
    const g = this.gamma;
    
    // Downstream Mach number
    // M2² = (M1² + 2/(γ-1)) / (2γ/(γ-1) * M1² - 1)
    const numerator = M1 * M1 + 2.0 / (g - 1.0);
    const denominator = (2.0 * g / (g - 1.0)) * M1 * M1 - 1.0;
    this.M2 = Math.sqrt(numerator / denominator);
    
    // Pressure ratio
    // P2/P1 = 1 + 2γ/(γ+1) * (M1² - 1)
    this.P_ratio = 1.0 + (2.0 * g / (g + 1.0)) * (M1 * M1 - 1.0);
    
    // Density ratio
    // ρ2/ρ1 = ((γ+1) * M1²) / (2 + (γ-1) * M1²)
    this.rho_ratio = ((g + 1.0) * M1 * M1) / (2.0 + (g - 1.0) * M1 * M1);
    
    // Temperature ratio
    // T2/T1 = (P2/P1) / (ρ2/ρ1)
    this.T_ratio = this.P_ratio / this.rho_ratio;
    
    // Stagnation pressure ratio (loss)
    // P02/P01 = [(γ+1) * M1² / (2 + (γ-1) * M1²)]^(γ/(γ-1)) * [(γ+1) / (2γ * M1² - (γ-1))]^(1/(γ-1))
    const term1 = ((g + 1.0) * M1 * M1) / (2.0 + (g - 1.0) * M1 * M1);
    const term2 = (g + 1.0) / (2.0 * g * M1 * M1 - (g - 1.0));
    this.P0_ratio = Math.pow(term1, g / (g - 1.0)) * Math.pow(term2, 1.0 / (g - 1.0));
    
    // Entropy change
    // Δs/R = ln(P02/P01)
    this.entropy_change = Math.log(this.P0_ratio);
  }
  
  getResults() {
    return {
      M1: this.M1,
      M2: this.M2,
      P_ratio: this.P_ratio,
      rho_ratio: this.rho_ratio,
      T_ratio: this.T_ratio,
      P0_ratio: this.P0_ratio,
      entropy_change: this.entropy_change,
      pressure_loss_percent: (1.0 - this.P0_ratio) * 100,
    };
  }
}

/**
 * PRANDTL-MEYER EXPANSION
 * For supersonic flow around corners (expansion fans)
 */
export function prandtlMeyerFunction(M, gamma = 1.25) {
  // ν(M) = √[(γ+1)/(γ-1)] * arctan(√[(γ-1)/(γ+1) * (M²-1)]) - arctan(√(M²-1))
  const sqrtTerm1 = Math.sqrt((gamma + 1.0) / (gamma - 1.0));
  const sqrtTerm2 = Math.sqrt(((gamma - 1.0) / (gamma + 1.0)) * (M * M - 1.0));
  const sqrtTerm3 = Math.sqrt(M * M - 1.0);
  
  return sqrtTerm1 * Math.atan(sqrtTerm2) - Math.atan(sqrtTerm3);
}

/**
 * EXPANSION WAVE
 * Calculates flow properties after expansion
 */
export class ExpansionWave {
  constructor(M1, turnAngle_deg, gamma = 1.25) {
    this.M1 = M1;
    this.theta = turnAngle_deg * Math.PI / 180; // Convert to radians
    this.gamma = gamma;
    
    if (M1 < 1.0) {
      throw new Error('Expansion requires supersonic flow (M > 1)');
    }
    
    this.calculate();
  }
  
  calculate() {
    const nu1 = prandtlMeyerFunction(this.M1, this.gamma);
    const nu2 = nu1 + this.theta;
    
    // Find M2 from ν2 (iterative)
    this.M2 = this.machFromPrandtlMeyer(nu2);
    
    // Use isentropic relations for property ratios
    const T1_ratio = isentropicTemperatureRatio(this.M1, this.gamma);
    const T2_ratio = isentropicTemperatureRatio(this.M2, this.gamma);
    this.T_ratio = T2_ratio / T1_ratio;
    
    const P1_ratio = isentropicPressureRatio(this.M1, this.gamma);
    const P2_ratio = isentropicPressureRatio(this.M2, this.gamma);
    this.P_ratio = P2_ratio / P1_ratio;
    
    const rho1_ratio = isentropicDensityRatio(this.M1, this.gamma);
    const rho2_ratio = isentropicDensityRatio(this.M2, this.gamma);
    this.rho_ratio = rho2_ratio / rho1_ratio;
  }
  
  machFromPrandtlMeyer(nu_target) {
    // Newton-Raphson to find M from ν
    let M = 2.0; // Initial guess
    
    for (let i = 0; i < 20; i++) {
      const nu = prandtlMeyerFunction(M, this.gamma);
      const error = nu - nu_target;
      
      if (Math.abs(error) < 1e-6) break;
      
      // Numerical derivative
      const dM = 0.0001;
      const nu_plus = prandtlMeyerFunction(M + dM, this.gamma);
      const dnu_dM = (nu_plus - nu) / dM;
      
      M = M - error / dnu_dM;
      
      if (M < 1.001) M = 1.001;
    }
    
    return M;
  }
  
  getResults() {
    return {
      M1: this.M1,
      M2: this.M2,
      turnAngle_deg: this.theta * 180 / Math.PI,
      P_ratio: this.P_ratio,
      T_ratio: this.T_ratio,
      rho_ratio: this.rho_ratio,
    };
  }
}

/**
 * CHARACTERISTIC MACH NUMBER
 * M* = M * √[γ / (1 + (γ-1)/2 * M²)]
 */
export function characteristicMach(M, gamma = 1.25) {
  return M * Math.sqrt(gamma / (1.0 + ((gamma - 1.0) / 2.0) * M * M));
}

/**
 * SPEED OF SOUND
 * a = √(γ * R * T)
 */
export function speedOfSound(T, gamma = 1.25, R_specific = 8314.46 / 25) {
  return Math.sqrt(gamma * R_specific * T);
}

/**
 * COMPLETE COMPRESSIBLE FLOW ANALYZER
 */
export class CompressibleFlowAnalyzer {
  constructor(params) {
    this.M = params.M;                  // Mach number
    this.T0 = params.T0;                // Stagnation temperature [K]
    this.P0 = params.P0;                // Stagnation pressure [Pa]
    this.gamma = params.gamma || 1.25;  // Specific heat ratio
    this.R = params.R || 8314.46 / 25;  // Gas constant [J/(kg·K)]
    
    this.analyze();
  }
  
  analyze() {
    // Isentropic properties
    this.T_ratio = isentropicTemperatureRatio(this.M, this.gamma);
    this.P_ratio = isentropicPressureRatio(this.M, this.gamma);
    this.rho_ratio = isentropicDensityRatio(this.M, this.gamma);
    
    // Static properties
    this.T = this.T0 * this.T_ratio;
    this.P = this.P0 * this.P_ratio;
    
    // Speed of sound
    this.a = speedOfSound(this.T, this.gamma, this.R);
    
    // Velocity
    this.V = this.M * this.a;
    
    // Dynamic pressure
    // q = 0.5 * ρ * V²
    const rho = this.P / (this.R * this.T);
    this.q = 0.5 * rho * this.V * this.V;
    
    // Characteristic Mach number
    this.M_star = characteristicMach(this.M, this.gamma);
    
    // Flow regime
    if (this.M < 0.3) {
      this.regime = 'incompressible';
    } else if (this.M < 0.8) {
      this.regime = 'subsonic_compressible';
    } else if (this.M < 1.0) {
      this.regime = 'transonic';
    } else if (this.M < 5.0) {
      this.regime = 'supersonic';
    } else {
      this.regime = 'hypersonic';
    }
  }
  
  getResults() {
    return {
      M: this.M,
      regime: this.regime,
      T: this.T,
      P: this.P,
      T_ratio: this.T_ratio,
      P_ratio: this.P_ratio,
      rho_ratio: this.rho_ratio,
      a: this.a,
      V: this.V,
      q: this.q,
      M_star: this.M_star,
    };
  }
}

export default {
  isentropicTemperatureRatio,
  isentropicPressureRatio,
  isentropicDensityRatio,
  isentropicAreaRatio,
  machFromAreaRatio,
  NormalShock,
  prandtlMeyerFunction,
  ExpansionWave,
  characteristicMach,
  speedOfSound,
  CompressibleFlowAnalyzer,
};
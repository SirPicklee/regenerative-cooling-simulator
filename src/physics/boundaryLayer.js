/**
 * BOUNDARY LAYER ANALYSIS
 * Advanced CFD calculations for laminar and turbulent boundary layers
 */

/**
 * CRITICAL REYNOLDS NUMBER
 * Transition from laminar to turbulent flow
 */
export const RE_CRITICAL = {
  FLAT_PLATE: 5e5,        // Typical for flat plate
  PIPE_INTERNAL: 2300,    // Internal pipe flow
  ROCKET_CHAMBER: 1e5,    // High turbulence environment
};

/**
 * LAMINAR BOUNDARY LAYER (Blasius Solution)
 * For flat plate, incompressible flow
 */
export class LaminarBoundaryLayer {
  constructor(Re_x, Pr, rho, mu, U_inf, x) {
    this.Re_x = Re_x;          // Local Reynolds number
    this.Pr = Pr;              // Prandtl number
    this.rho = rho;            // Density [kg/m³]
    this.mu = mu;              // Dynamic viscosity [Pa·s]
    this.U_inf = U_inf;        // Freestream velocity [m/s]
    this.x = x;                // Distance from leading edge [m]
    
    this.calculate();
  }
  
  calculate() {
    // Blasius boundary layer thickness
    // δ = 5.0 * x / sqrt(Re_x)
    this.delta = 5.0 * this.x / Math.sqrt(this.Re_x);
    
    // Displacement thickness
    // δ* = 1.721 * x / sqrt(Re_x)
    this.delta_star = 1.721 * this.x / Math.sqrt(this.Re_x);
    
    // Momentum thickness
    // θ = 0.664 * x / sqrt(Re_x)
    this.theta = 0.664 * this.x / Math.sqrt(this.Re_x);
    
    // Shape factor
    // H = δ* / θ
    this.H = this.delta_star / this.theta;
    
    // Skin friction coefficient
    // Cf = 0.664 / sqrt(Re_x)
    this.Cf = 0.664 / Math.sqrt(this.Re_x);
    
    // Wall shear stress
    // τ_w = 0.5 * ρ * U² * Cf
    this.tau_w = 0.5 * this.rho * this.U_inf * this.U_inf * this.Cf;
    
    // Thermal boundary layer (if Pr != 1)
    // δ_t / δ = Pr^(-1/3)
    this.delta_thermal = this.delta * Math.pow(this.Pr, -1/3);
    
    // Heat transfer coefficient (Reynolds analogy)
    // St = Cf / 2 = Nu / (Re * Pr)
    const St = this.Cf / 2;
    this.Nu_x = St * this.Re_x * this.Pr;
  }
  
  getResults() {
    return {
      type: 'laminar',
      delta: this.delta,
      delta_star: this.delta_star,
      theta: this.theta,
      H: this.H,
      Cf: this.Cf,
      tau_w: this.tau_w,
      delta_thermal: this.delta_thermal,
      Nu_x: this.Nu_x,
    };
  }
}

/**
 * TURBULENT BOUNDARY LAYER (1/7th Power Law)
 * For flat plate, incompressible flow
 */
export class TurbulentBoundaryLayer {
  constructor(Re_x, Pr, rho, mu, U_inf, x) {
    this.Re_x = Re_x;
    this.Pr = Pr;
    this.rho = rho;
    this.mu = mu;
    this.U_inf = U_inf;
    this.x = x;
    
    this.calculate();
  }
  
  calculate() {
    // Turbulent boundary layer thickness (1/7th power law)
    // δ = 0.37 * x / Re_x^(1/5)
    this.delta = 0.37 * this.x / Math.pow(this.Re_x, 0.2);
    
    // Displacement thickness
    // δ* = 0.046 * x / Re_x^(1/5)
    this.delta_star = 0.046 * this.x / Math.pow(this.Re_x, 0.2);
    
    // Momentum thickness
    // θ = 0.036 * x / Re_x^(1/5)
    this.theta = 0.036 * this.x / Math.pow(this.Re_x, 0.2);
    
    // Shape factor (typically ~1.3 for turbulent)
    this.H = this.delta_star / this.theta;
    
    // Skin friction coefficient (Prandtl-Schlichting)
    // Cf = 0.0592 / Re_x^(1/5)
    this.Cf = 0.0592 / Math.pow(this.Re_x, 0.2);
    
    // Wall shear stress
    this.tau_w = 0.5 * this.rho * this.U_inf * this.U_inf * this.Cf;
    
    // Thermal boundary layer (Reynolds analogy)
    // For turbulent flow, Pr effect is weaker
    this.delta_thermal = this.delta * Math.pow(this.Pr, -0.4);
    
    // Heat transfer (Colburn analogy)
    // St = Cf / 2 * Pr^(-2/3)
    const St = (this.Cf / 2) * Math.pow(this.Pr, -2/3);
    this.Nu_x = St * this.Re_x * this.Pr;
  }
  
  getResults() {
    return {
      type: 'turbulent',
      delta: this.delta,
      delta_star: this.delta_star,
      theta: this.theta,
      H: this.H,
      Cf: this.Cf,
      tau_w: this.tau_w,
      delta_thermal: this.delta_thermal,
      Nu_x: this.Nu_x,
    };
  }
}

/**
 * WALL DISTANCE ANALYSIS (y+ calculation)
 * Critical for turbulence modeling
 */
export class WallDistanceAnalysis {
  constructor(tau_w, rho, mu, y) {
    this.tau_w = tau_w;    // Wall shear stress [Pa]
    this.rho = rho;        // Density [kg/m³]
    this.mu = mu;          // Dynamic viscosity [Pa·s]
    this.y = y;            // Distance from wall [m]
    
    this.calculate();
  }
  
  calculate() {
    // Friction velocity
    // u_τ = sqrt(τ_w / ρ)
    this.u_tau = Math.sqrt(this.tau_w / this.rho);
    
    // Dimensionless wall distance
    // y+ = ρ * u_τ * y / μ
    this.y_plus = (this.rho * this.u_tau * this.y) / this.mu;
    
    // Classify region
    if (this.y_plus < 5) {
      this.region = 'viscous_sublayer';
      this.description = 'Viscous dominated, linear velocity profile';
    } else if (this.y_plus < 30) {
      this.region = 'buffer_layer';
      this.description = 'Transition region, both viscous and turbulent';
    } else {
      this.region = 'log_layer';
      this.description = 'Fully turbulent, logarithmic velocity profile';
    }
  }
  
  // Velocity profile based on y+
  getVelocityProfile() {
    if (this.y_plus < 5) {
      // Viscous sublayer: u+ = y+
      return {
        u_plus: this.y_plus,
        formula: 'u+ = y+ (linear)',
      };
    } else {
      // Log layer: u+ = (1/κ) * ln(y+) + B
      const kappa = 0.41;  // von Kármán constant
      const B = 5.0;       // Log-law constant
      const u_plus = (1 / kappa) * Math.log(this.y_plus) + B;
      return {
        u_plus: u_plus,
        formula: 'u+ = (1/κ)ln(y+) + B (log-law)',
      };
    }
  }
  
  getResults() {
    const velocity = this.getVelocityProfile();
    return {
      u_tau: this.u_tau,
      y_plus: this.y_plus,
      region: this.region,
      description: this.description,
      u_plus: velocity.u_plus,
      formula: velocity.formula,
    };
  }
}

/**
 * COMPLETE BOUNDARY LAYER ANALYZER
 * Determines type and calculates all properties
 */
export class BoundaryLayerAnalyzer {
  constructor(x, U_inf, rho, mu, Pr, Re_critical = RE_CRITICAL.ROCKET_CHAMBER) {
    this.x = x;              // Position [m]
    this.U_inf = U_inf;      // Freestream velocity [m/s]
    this.rho = rho;          // Density [kg/m³]
    this.mu = mu;            // Viscosity [Pa·s]
    this.Pr = Pr;            // Prandtl number
    this.Re_critical = Re_critical;
    
    // Calculate local Reynolds number
    this.Re_x = (this.rho * this.U_inf * this.x) / this.mu;
    
    this.analyze();
  }
  
  analyze() {
    // Determine if laminar or turbulent
    if (this.Re_x < this.Re_critical) {
      this.bl = new LaminarBoundaryLayer(
        this.Re_x, this.Pr, this.rho, this.mu, this.U_inf, this.x
      );
      this.isTransitional = false;
    } else {
      this.bl = new TurbulentBoundaryLayer(
        this.Re_x, this.Pr, this.rho, this.mu, this.U_inf, this.x
      );
      this.isTransitional = (this.Re_x < this.Re_critical * 2);
    }
    
    // Get boundary layer results
    this.results = this.bl.getResults();
    
    // Wall distance analysis (at first grid point)
    const y_first = this.results.delta / 100; // 1% of boundary layer
    this.wallAnalysis = new WallDistanceAnalysis(
      this.results.tau_w,
      this.rho,
      this.mu,
      y_first
    );
  }
  
  getCompleteResults() {
    return {
      Re_x: this.Re_x,
      isTransitional: this.isTransitional,
      ...this.results,
      wallAnalysis: this.wallAnalysis.getResults(),
    };
  }
}

export default {
  RE_CRITICAL,
  LaminarBoundaryLayer,
  TurbulentBoundaryLayer,
  WallDistanceAnalysis,
  BoundaryLayerAnalyzer,
};
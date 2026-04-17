/**
 * TRANSIENT HEAT TRANSFER
 * Time-dependent thermal analysis for startup and shutdown
 */

import { MaterialHelpers } from './materials';

/**
 * FOURIER NUMBER
 * Dimensionless time for transient heat conduction
 * Fo = α * t / L²
 */
export function fourierNumber(alpha, time, length) {
  return alpha * time / (length * length);
}

/**
 * THERMAL DIFFUSIVITY
 * α = k / (ρ * c_p)
 * Unit: m²/s
 */
export function thermalDiffusivity(k, rho, cp) {
  return k / (rho * cp);
}

/**
 * BIOT NUMBER
 * Bi = h * L / k
 * Measures ratio of internal to external thermal resistance
 */
export function biotNumber(h, L, k) {
  return h * L / k;
}

/**
 * LUMPED CAPACITANCE MODEL
 * Valid when Bi < 0.1
 * T(t) = T_inf + (T_0 - T_inf) * exp(-h*A*t / (ρ*V*c_p))
 */
export function lumpedCapacitance(T_inf, T_0, h, A, rho, V, cp, t) {
  const tau = (rho * V * cp) / (h * A); // Time constant
  return T_inf + (T_0 - T_inf) * Math.exp(-t / tau);
}

/**
 * TIME CONSTANT
 * τ = (ρ * V * c_p) / (h * A)
 * Time to reach ~63% of final temperature
 */
export function timeConstant(rho, V, cp, h, A) {
  return (rho * V * cp) / (h * A);
}

/**
 * SEMI-INFINITE SOLID SOLUTION
 * For thick walls with sudden temperature change at surface
 * T(x,t) = T_s + (T_0 - T_s) * erf(x / (2*sqrt(α*t)))
 */
export function semiInfiniteSolid(x, t, T_s, T_0, alpha) {
  const eta = x / (2 * Math.sqrt(alpha * t));
  const erfValue = erf(eta);
  return T_s + (T_0 - T_s) * erfValue;
}

/**
 * ERROR FUNCTION (erf) APPROXIMATION
 * Accurate to 1.5e-7
 */
function erf(x) {
  // Abramowitz and Stegun approximation
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

/**
 * FINITE DIFFERENCE SCHEME
 * Explicit method for 1D heat equation
 * ∂T/∂t = α * ∂²T/∂x²
 */
export class ExplicitFiniteDifference {
  constructor(params) {
    this.L = params.length;           // Domain length [m]
    this.n = params.gridPoints;       // Number of grid points
    this.alpha = params.alpha;        // Thermal diffusivity [m²/s]
    this.T_initial = params.T_initial; // Initial temperature [K]
    this.T_left = params.T_left;      // Left boundary temperature [K]
    this.T_right = params.T_right;    // Right boundary temperature [K]
    
    this.dx = this.L / (this.n - 1);
    
    // Stability criterion: dt < dx² / (2*α)
    this.dt_max = this.dx * this.dx / (2 * this.alpha);
    this.dt = this.dt_max * 0.5; // Use 50% of maximum for safety
    
    // Initialize temperature array
    this.T = new Array(this.n).fill(this.T_initial);
    this.T[0] = this.T_left;
    this.T[this.n - 1] = this.T_right;
    
    this.time = 0;
  }
  
  step() {
    const T_new = [...this.T];
    const r = this.alpha * this.dt / (this.dx * this.dx); // Fourier number
    
    // Interior points (explicit scheme)
    for (let i = 1; i < this.n - 1; i++) {
      T_new[i] = this.T[i] + r * (this.T[i + 1] - 2 * this.T[i] + this.T[i - 1]);
    }
    
    // Boundary conditions
    T_new[0] = this.T_left;
    T_new[this.n - 1] = this.T_right;
    
    this.T = T_new;
    this.time += this.dt;
    
    return {
      time: this.time,
      T: [...this.T],
      dx: this.dx,
    };
  }
  
  solve(totalTime) {
    const results = [];
    const numSteps = Math.ceil(totalTime / this.dt);
    
    for (let step = 0; step < numSteps; step++) {
      if (step % 10 === 0) { // Save every 10th step
        results.push(this.step());
      } else {
        this.step();
      }
    }
    
    return results;
  }
}

/**
 * ENGINE STARTUP SEQUENCE
 * Models transient behavior during engine ignition and ramp-up
 */
export class EngineStartup {
  constructor(params) {
    this.t_ignition = params.t_ignition || 0;      // Ignition time [s]
    this.t_rampup = params.t_rampup || 2.0;        // Ramp-up duration [s]
    this.thrust_max = params.thrust_max || 1.0;    // Maximum thrust (normalized)
    this.T_chamber_max = params.T_chamber_max;     // Max chamber temp [K]
    this.P_chamber_max = params.P_chamber_max;     // Max chamber pressure [Pa]
    this.massFlowRate_max = params.massFlowRate_max; // Max mass flow [kg/s]
  }
  
  getThrustProfile(t) {
    if (t < this.t_ignition) {
      return 0;
    } else if (t < this.t_ignition + this.t_rampup) {
      // Smooth ramp-up (S-curve)
      const tau = (t - this.t_ignition) / this.t_rampup;
      return this.thrust_max * (3 * tau * tau - 2 * tau * tau * tau);
    } else {
      return this.thrust_max;
    }
  }
  
  getChamberTemp(t) {
    const thrust = this.getThrustProfile(t);
    return 293 + (this.T_chamber_max - 293) * thrust; // Ramp from ambient
  }
  
  getChamberPressure(t) {
    const thrust = this.getThrustProfile(t);
    return this.P_chamber_max * thrust;
  }
  
  getMassFlowRate(t) {
    const thrust = this.getThrustProfile(t);
    return this.massFlowRate_max * thrust;
  }
  
  getParameters(t) {
    return {
      thrust: this.getThrustProfile(t),
      T_chamber: this.getChamberTemp(t),
      P_chamber: this.getChamberPressure(t),
      massFlowRate: this.getMassFlowRate(t),
    };
  }
}

/**
 * ENGINE SHUTDOWN SEQUENCE
 * Models cooldown behavior after engine cutoff
 */
export class EngineShutdown {
  constructor(params) {
    this.t_cutoff = params.t_cutoff || 0;         // Cutoff time [s]
    this.t_cooldown = params.t_cooldown || 10.0;  // Cooldown duration [s]
    this.T_initial = params.T_initial;            // Initial wall temp [K]
    this.T_ambient = params.T_ambient || 293;     // Ambient temp [K]
    this.tau = params.tau || 5.0;                 // Cooling time constant [s]
  }
  
  getWallTemp(t) {
    if (t < this.t_cutoff) {
      return this.T_initial;
    } else {
      const dt = t - this.t_cutoff;
      // Exponential decay
      return this.T_ambient + (this.T_initial - this.T_ambient) * Math.exp(-dt / this.tau);
    }
  }
  
  getCoolingRate(t) {
    if (t < this.t_cutoff) {
      return 0;
    } else {
      const dt = t - this.t_cutoff;
      return -(this.T_initial - this.T_ambient) / this.tau * Math.exp(-dt / this.tau);
    }
  }
}

/**
 * COMPLETE TRANSIENT ANALYZER
 * Combines startup, steady-state, and shutdown
 */
export class TransientAnalyzer {
  constructor(params) {
    this.startup = new EngineStartup({
      t_ignition: 0,
      t_rampup: params.t_rampup || 2.0,
      thrust_max: 1.0,
      T_chamber_max: params.T_chamber_max,
      P_chamber_max: params.P_chamber_max,
      massFlowRate_max: params.massFlowRate_max,
    });
    
    this.t_steady = params.t_steady || 5.0; // Steady-state duration
    this.t_total = params.t_rampup + this.t_steady;
    
    this.shutdown = new EngineShutdown({
      t_cutoff: this.t_total,
      t_cooldown: params.t_cooldown || 10.0,
      T_initial: params.T_chamber_max,
      T_ambient: 293,
      tau: params.tau_cooling || 5.0,
    });
  }
  
  getStateAtTime(t) {
    if (t <= this.t_total) {
      // Startup or steady-state
      return this.startup.getParameters(t);
    } else {
      // Shutdown
      return {
        thrust: 0,
        T_chamber: this.shutdown.getWallTemp(t),
        P_chamber: 0,
        massFlowRate: 0,
        coolingRate: this.shutdown.getCoolingRate(t),
      };
    }
  }
  
  generateTimeline(dt = 0.1) {
    const timeline = [];
    const t_max = this.t_total + this.shutdown.t_cooldown;
    
    for (let t = 0; t <= t_max; t += dt) {
      const state = this.getStateAtTime(t);
      timeline.push({
        time: t,
        ...state,
      });
    }
    
    return timeline;
  }
}

export default {
  fourierNumber,
  thermalDiffusivity,
  biotNumber,
  lumpedCapacitance,
  timeConstant,
  semiInfiniteSolid,
  ExplicitFiniteDifference,
  EngineStartup,
  EngineShutdown,
  TransientAnalyzer,
};
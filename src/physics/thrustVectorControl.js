/**
 * THRUST VECTOR CONTROL (TVC)
 * Engine gimballing for attitude control
 */

/**
 * GIMBAL GEOMETRY
 * Calculate side force and torque from gimbal angle
 * 
 * F_side = F_thrust * sin(δ)
 * F_axial = F_thrust * cos(δ)
 * 
 * Where δ = gimbal angle
 */
export function gimbalForces(F_thrust, delta_deg) {
  const delta = delta_deg * Math.PI / 180;
  
  const F_side = F_thrust * Math.sin(delta);
  const F_axial = F_thrust * Math.cos(delta);
  
  return {
    F_side: F_side,
    F_axial: F_axial,
    delta_rad: delta,
  };
}

/**
 * CONTROL TORQUE
 * Torque generated about vehicle CG
 * 
 * τ = F_side * L_moment_arm
 * 
 * Where L_moment_arm is distance from gimbal point to CG
 */
export function controlTorque(F_side, L_moment_arm) {
  return F_side * L_moment_arm;
}

/**
 * GIMBAL ACTUATOR FORCE
 * Force required to deflect nozzle
 * 
 * F_actuator = F_thrust * sin(δ) + k_spring * δ + c_damper * δ̇
 * 
 * Simplified: F_actuator ≈ F_side + restoring forces
 */
export function actuatorForce(params) {
  const {
    F_thrust,
    delta_deg,
    k_spring,      // Spring stiffness [N/rad]
    delta_dot,     // Angular velocity [rad/s]
    c_damper,      // Damping coefficient [N·s/rad]
  } = params;
  
  const delta_rad = delta_deg * Math.PI / 180;
  const F_side = F_thrust * Math.sin(delta_rad);
  
  // Actuator must overcome:
  // 1. Side force component
  // 2. Spring restoring force
  // 3. Damping force
  const F_spring = k_spring * delta_rad;
  const F_damping = c_damper * delta_dot;
  
  const F_actuator = F_side + F_spring + F_damping;
  
  return {
    F_actuator: F_actuator,
    F_side: F_side,
    F_spring: F_spring,
    F_damping: F_damping,
  };
}

/**
 * ACTUATOR STROKE
 * Linear displacement of actuator for given gimbal angle
 * 
 * s = L * sin(δ)
 * 
 * Where L is distance from gimbal point to actuator attachment
 */
export function actuatorStroke(L_attachment, delta_deg) {
  const delta = delta_deg * Math.PI / 180;
  return L_attachment * Math.sin(delta);
}

/**
 * ACTUATOR POWER
 * Power required to gimbal engine
 * 
 * P = F_actuator * v_actuator
 * 
 * Where v_actuator = L * δ̇ * cos(δ)
 */
export function actuatorPower(F_actuator, L_attachment, delta_deg, delta_dot) {
  const delta = delta_deg * Math.PI / 180;
  const v_actuator = L_attachment * delta_dot * Math.cos(delta);
  
  return F_actuator * v_actuator;
}

/**
 * CONTROL AUTHORITY
 * Maximum angular acceleration achievable
 * 
 * α_max = τ_max / I
 * 
 * Where:
 * - τ_max = maximum control torque
 * - I = vehicle moment of inertia
 */
export function controlAuthority(tau_max, I_vehicle) {
  return tau_max / I_vehicle;
}

/**
 * GIMBAL RESPONSE TIME
 * Time to deflect from 0 to max angle
 * 
 * Simplified: t_response ≈ δ_max / ω_natural
 * 
 * Where ω_natural = sqrt(k/I_gimbal)
 */
export function gimbalResponseTime(params) {
  const {
    delta_max_deg,
    k_spring,
    I_gimbal,      // Moment of inertia of engine about gimbal
  } = params;
  
  const omega_natural = Math.sqrt(k_spring / I_gimbal);
  const delta_max_rad = delta_max_deg * Math.PI / 180;
  
  const t_response = delta_max_rad / omega_natural;
  
  return {
    t_response: t_response,
    omega_natural: omega_natural,
    f_natural: omega_natural / (2 * Math.PI),
  };
}

/**
 * SLOSH COUPLING
 * Effect of propellant slosh on TVC performance
 * 
 * Slosh frequency: f_slosh ≈ sqrt(g/L_tank) / (2π)
 */
export function sloshFrequency(L_tank, g = 9.81) {
  const omega_slosh = Math.sqrt(g / L_tank);
  const f_slosh = omega_slosh / (2 * Math.PI);
  
  return {
    f_slosh: f_slosh,
    omega_slosh: omega_slosh,
  };
}

/**
 * THERMAL EFFECTS ON TVC
 * Thermal expansion of actuator components
 * 
 * ΔL = L * α * ΔT
 */
export function thermalExpansion(L, alpha, deltaT) {
  return L * alpha * deltaT;
}

/**
 * SIDE LOAD ON NOZZLE
 * Due to asymmetric flow during gimballing
 * 
 * F_sideload ≈ 0.1 * F_thrust * δ²
 * 
 * Quadratic with gimbal angle
 */
export function nozzleSideLoad(F_thrust, delta_deg) {
  const delta_rad = delta_deg * Math.PI / 180;
  
  // Empirical correlation
  const C = 0.1; // Coefficient
  const F_sideload = C * F_thrust * delta_rad * delta_rad;
  
  return F_sideload;
}

/**
 * GIMBAL BEARING LOAD
 * Total load on gimbal bearings
 * 
 * F_bearing = sqrt(F_thrust² + F_sideload²)
 */
export function gimbalBearingLoad(F_thrust, F_sideload) {
  return Math.sqrt(F_thrust * F_thrust + F_sideload * F_sideload);
}

/**
 * TVC PERFORMANCE METRICS
 * Overall system performance
 */
export function performanceMetrics(params) {
  const {
    F_thrust,
    delta_max_deg,
    L_moment_arm,
    I_vehicle,
    response_time,
  } = params;
  
  // Maximum control torque
  const forces = gimbalForces(F_thrust, delta_max_deg);
  const tau_max = controlTorque(forces.F_side, L_moment_arm);
  
  // Maximum angular acceleration
  const alpha_max = controlAuthority(tau_max, I_vehicle);
  
  // Control bandwidth (1/response_time)
  const bandwidth = 1 / response_time;
  
  return {
    tau_max: tau_max,
    alpha_max: alpha_max,
    bandwidth: bandwidth,
  };
}

/**
 * COMPLETE THRUST VECTOR CONTROL ANALYZER
 */
export class ThrustVectorControlAnalyzer {
  constructor(params) {
    this.F_thrust = params.F_thrust;
    this.delta_max = params.delta_max || 8;           // degrees (±8° typical)
    this.L_moment_arm = params.L_moment_arm || 10;    // 10m from gimbal to CG
    this.L_attachment = params.L_attachment || 0.5;   // 0.5m actuator attachment
    this.I_vehicle = params.I_vehicle || 1e6;         // kg·m² (large rocket)
    this.I_gimbal = params.I_gimbal || 5000;          // kg·m² (engine about gimbal)
    this.k_spring = params.k_spring || 1e7;           // N/rad
    this.c_damper = params.c_damper || 5e5;           // N·s/rad
    this.delta_dot_max = params.delta_dot_max || 0.5; // rad/s
    
    this.analyze();
  }
  
  analyze() {
    // Analyze at several gimbal angles
    this.gimbalData = [];
    const angles = [0, 2, 4, 6, 8];
    
    for (const delta of angles) {
      if (delta > this.delta_max) continue;
      
      // Forces at this angle
      const forces = gimbalForces(this.F_thrust, delta);
      
      // Control torque
      const tau = controlTorque(forces.F_side, this.L_moment_arm);
      
      // Actuator requirements
      const actuator = actuatorForce({
        F_thrust: this.F_thrust,
        delta_deg: delta,
        k_spring: this.k_spring,
        delta_dot: this.delta_dot_max,
        c_damper: this.c_damper,
      });
      
      // Actuator stroke
      const stroke = actuatorStroke(this.L_attachment, delta);
      
      // Actuator power
      const power = actuatorPower(
        actuator.F_actuator,
        this.L_attachment,
        delta,
        this.delta_dot_max
      );
      
      // Side load on nozzle
      const F_sideload = nozzleSideLoad(this.F_thrust, delta);
      
      // Bearing load
      const F_bearing = gimbalBearingLoad(this.F_thrust, F_sideload);
      
      this.gimbalData.push({
        delta: delta,
        F_side: forces.F_side,
        F_axial: forces.F_axial,
        tau: tau,
        F_actuator: actuator.F_actuator,
        stroke: stroke,
        power: power,
        F_sideload: F_sideload,
        F_bearing: F_bearing,
      });
    }
    
    // Maximum values (at max gimbal angle)
    const maxData = this.gimbalData[this.gimbalData.length - 1];
    this.F_side_max = maxData.F_side;
    this.tau_max = maxData.tau;
    this.F_actuator_max = maxData.F_actuator;
    this.stroke_max = maxData.stroke;
    this.power_max = maxData.power;
    this.F_bearing_max = maxData.F_bearing;
    
    // Response characteristics
    const response = gimbalResponseTime({
      delta_max_deg: this.delta_max,
      k_spring: this.k_spring,
      I_gimbal: this.I_gimbal,
    });
    
    this.t_response = response.t_response;
    this.f_natural = response.f_natural;
    this.omega_natural = response.omega_natural;
    
    // Control authority
    this.alpha_max = controlAuthority(this.tau_max, this.I_vehicle);
    
    // Bandwidth
    this.bandwidth = 1 / this.t_response;
    
    // Slosh frequency (assume 5m tank height)
    const slosh = sloshFrequency(5);
    this.f_slosh = slosh.f_slosh;
    
    // Check for slosh coupling (bad if f_natural ≈ f_slosh)
    this.slosh_coupling_risk = Math.abs(this.f_natural - this.f_slosh) < 0.2;
  }
  
  getResults() {
    return {
      F_side_max: this.F_side_max,
      tau_max: this.tau_max,
      F_actuator_max: this.F_actuator_max,
      stroke_max: this.stroke_max,
      power_max: this.power_max,
      F_bearing_max: this.F_bearing_max,
      t_response: this.t_response,
      f_natural: this.f_natural,
      omega_natural: this.omega_natural,
      alpha_max: this.alpha_max,
      bandwidth: this.bandwidth,
      f_slosh: this.f_slosh,
      slosh_coupling_risk: this.slosh_coupling_risk,
      gimbalData: this.gimbalData,
    };
  }
}

export default {
  gimbalForces,
  controlTorque,
  actuatorForce,
  actuatorStroke,
  actuatorPower,
  controlAuthority,
  gimbalResponseTime,
  sloshFrequency,
  thermalExpansion,
  nozzleSideLoad,
  gimbalBearingLoad,
  performanceMetrics,
  ThrustVectorControlAnalyzer,
};
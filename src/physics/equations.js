/**
 * HEAT TRANSFER EQUATIONS
 * Core thermal calculations for regenerative cooling
 */

import { DIMENSIONLESS } from './constants';
import { MaterialHelpers } from './materials';

/**
 * Calculate convective heat transfer coefficient
 * h = Nu * k / D
 */
export function convectionCoefficient(Re, Pr, k, D, heating = true) {
  const Nu = DIMENSIONLESS.nusseltDittusBoelter(Re, Pr, heating);
  return DIMENSIONLESS.heatTransferCoeff(Nu, k, D);
}

/**
 * Calculate heat flux from hot gas to wall
 * q" = h_gas * (T_gas - T_wall)
 */
export function hotGasHeatFlux(T_gas, T_wall, h_gas) {
  return h_gas * (T_gas - T_wall);
}

/**
 * Calculate heat flux through wall (Fourier's Law)
 * q" = -k * dT/dx
 */
export function conductionHeatFlux(k_wall, T_hot, T_cold, thickness) {
  return k_wall * (T_hot - T_cold) / thickness;
}

/**
 * Calculate heat flux from wall to coolant
 * q" = h_coolant * (T_wall - T_coolant)
 */
export function coolantHeatFlux(T_wall, T_coolant, h_coolant) {
  return h_coolant * (T_wall - T_coolant);
}

/**
 * COMPLETE THERMAL RESISTANCE NETWORK
 * 1/U = 1/h_gas + t_wall/k_wall + 1/h_coolant
 */
export function overallHeatTransferCoeff(h_gas, h_coolant, k_wall, t_wall) {
  const R_gas = 1 / h_gas;
  const R_wall = t_wall / k_wall;
  const R_coolant = 1 / h_coolant;
  const R_total = R_gas + R_wall + R_coolant;
  return 1 / R_total;
}

/**
 * Calculate total heat flux through all resistances
 * q" = U * (T_gas - T_coolant)
 */
export function totalHeatFlux(T_gas, T_coolant, U) {
  return U * (T_gas - T_coolant);
}

/**
 * Calculate wall temperature at hot side
 * T_wall_hot = T_gas - q" / h_gas
 */
export function hotWallTemperature(T_gas, q_flux, h_gas) {
  return T_gas - q_flux / h_gas;
}

/**
 * Calculate wall temperature at cold side
 * T_wall_cold = T_coolant + q" / h_coolant
 */
export function coldWallTemperature(T_coolant, q_flux, h_coolant) {
  return T_coolant + q_flux / h_coolant;
}

/**
 * Calculate coolant temperature rise
 * ΔT = q" * A / (m_dot * cp)
 */
export function coolantTempRise(q_flux, area, massFlow, cp) {
  return (q_flux * area) / (massFlow * cp);
}

/**
 * Calculate pressure drop in channel (Darcy-Weisbach)
 * ΔP = f * (L/D) * (ρ*v²/2)
 */
export function pressureDrop(f, L, D, rho, v) {
  return f * (L / D) * (rho * v * v / 2);
}

/**
 * Friction factor for turbulent flow (Blasius)
 * f = 0.316 * Re^(-0.25)
 */
export function frictionFactor(Re) {
  if (Re < 2300) {
    // Laminar
    return 64 / Re;
  } else {
    // Turbulent (Blasius)
    return 0.316 * Math.pow(Re, -0.25);
  }
}

/**
 * COMPLETE THERMAL ANALYSIS AT A STATION
 */
export class ThermalStation {
  constructor(x, geometry, coolantProps, gasProps, wallProps, massFlow) {
    this.x = x;
    this.geometry = geometry;
    this.coolantProps = coolantProps;
    this.gasProps = gasProps;
    this.wallProps = wallProps;
    this.massFlow = massFlow;
    
    // Channel properties
    const D_h = 2 * 0.002 * 0.003 / (0.002 + 0.003); // Hydraulic diameter
    const A_channel = 0.002 * 0.003; // Channel area
    const velocity = massFlow / (coolantProps.rho * A_channel * 360); // 360 channels
    
    // Reynolds numbers
    this.Re_coolant = DIMENSIONLESS.reynolds(
      coolantProps.rho,
      velocity,
      D_h,
      coolantProps.mu
    );
    
    this.Re_gas = 1e6; // Simplified - very high in combustion chamber
    
    // Heat transfer coefficients
    this.h_coolant = convectionCoefficient(
      this.Re_coolant,
      coolantProps.Pr,
      coolantProps.k,
      D_h,
      true
    );
    
    this.h_gas = convectionCoefficient(
      this.Re_gas,
      gasProps.Pr,
      gasProps.k,
      geometry.getRadius(x) * 2,
      false
    ) * 5; // Multiplier for high-speed turbulent flow
  }
  
  solve(T_gas, T_coolant_in) {
    const t_wall = 0.001; // 1mm wall
    
    // Overall heat transfer coefficient
    const U = overallHeatTransferCoeff(
      this.h_gas,
      this.h_coolant,
      this.wallProps.k,
      t_wall
    );
    
    // Heat flux
    const q_flux = totalHeatFlux(T_gas, T_coolant_in, U);
    
    // Wall temperatures
    const T_wall_hot = hotWallTemperature(T_gas, q_flux, this.h_gas);
    const T_wall_cold = coldWallTemperature(T_coolant_in, q_flux, this.h_coolant);
    
    // Coolant temperature rise
    const area = 2 * Math.PI * this.geometry.getRadius(this.x) * 0.01; // Per cm axial
    const dT_coolant = coolantTempRise(q_flux, area, this.massFlow, this.coolantProps.cp);
    
    return {
      q_flux,
      T_wall_hot,
      T_wall_cold,
      T_coolant_out: T_coolant_in + dT_coolant,
      h_coolant: this.h_coolant,
      h_gas: this.h_gas,
      Re_coolant: this.Re_coolant,
    };
  }
}

export default {
  convectionCoefficient,
  hotGasHeatFlux,
  conductionHeatFlux,
  coolantHeatFlux,
  overallHeatTransferCoeff,
  totalHeatFlux,
  hotWallTemperature,
  coldWallTemperature,
  coolantTempRise,
  pressureDrop,
  frictionFactor,
  ThermalStation,
};
/**
 * THERMAL SOLVER
 * Main solver for regenerative cooling simulation
 */

import { CONSTANTS, UNITS } from './constants';
import { MaterialHelpers } from './materials';
import { ThermalStation } from './equations';

/**
 * REGENERATIVE COOLING SOLVER
 * Marches axially through the engine, solving thermal balance at each station
 */
export class RegenerativeCoolingSolver {
  constructor(geometry, mesh, params = {}) {
    this.geometry = geometry;
    this.mesh = mesh;
    
    // Operating conditions (use params or defaults)
    this.T_chamber = params.chamberTemp || CONSTANTS.CHAMBER_TEMP; // K
    this.P_chamber = (params.chamberPressure || 300) * 1e5; // Convert bar to Pa
    this.massFlowRate = params.massFlowRate || 18; // kg/s total coolant flow
    
    // Initial coolant conditions
    this.T_coolant_inlet = params.coolantInletTemp || 111; // K
    this.P_coolant = this.P_chamber + 5e6; // Pa (50 bar above chamber)
    
    // Results storage
    this.results = {
      axialPositions: [],
      heatFlux: [],
      wallTempHot: [],
      wallTempCold: [],
      coolantTemp: [],
      gasTemp: [],
    };
  }
  
  /**
   * Run the complete thermal simulation
   */
  solve() {
    console.log('🔥 Starting Thermal Solver...');
    
    // Get axial positions from mesh
    const axialPositions = [...new Set(this.mesh.nodes.map(n => n.x))].sort((a, b) => a - b);
    
    let T_coolant = this.T_coolant_inlet;
    
    // March through each axial station
    for (let i = 0; i < axialPositions.length; i++) {
      const x = axialPositions[i];
      
      // Get local gas temperature (varies along nozzle)
      const T_gas = this.getLocalGasTemp(x);
      const P_gas = this.getLocalGasPressure(x);
      
      // Get material properties at current temperatures
      const coolantProps = MaterialHelpers.getCoolantProperties(T_coolant, this.P_coolant);
      const gasProps = MaterialHelpers.getGasProperties(T_gas, P_gas);
      const wallProps = MaterialHelpers.getWallProperties(500); // Initial guess
      
      // Create thermal station
      const station = new ThermalStation(
        x,
        this.geometry,
        coolantProps,
        gasProps,
        wallProps,
        this.massFlowRate
      );
      
      // Solve thermal balance
      const solution = station.solve(T_gas, T_coolant);
      
      // Store results
      this.results.axialPositions.push(x);
      this.results.heatFlux.push(solution.q_flux);
      this.results.wallTempHot.push(solution.T_wall_hot);
      this.results.wallTempCold.push(solution.T_wall_cold);
      this.results.coolantTemp.push(T_coolant);
      this.results.gasTemp.push(T_gas);
      
      // Update coolant temperature for next station
      T_coolant = solution.T_coolant_out;
    }
    
    console.log('✅ Thermal Solver Complete!');
    return this.results;
  }
  
  /**
   * Get local gas temperature (isentropic expansion)
   * T/T0 = (P/P0)^((γ-1)/γ)
   */
  getLocalGasTemp(x) {
    const section = this.geometry.getSection(x);
    
    if (section === 'chamber' || section === 'convergent') {
      return this.T_chamber; // Hot combustion zone
    }
    
    // In nozzle, temperature drops due to expansion
    const P_local = this.getLocalGasPressure(x);
    const gamma = 1.25;
    const ratio = Math.pow(P_local / this.P_chamber, (gamma - 1) / gamma);
    return this.T_chamber * ratio;
  }
  
  /**
   * Get local gas pressure (isentropic expansion)
   * P/P0 = (A0/A)^γ (simplified)
   */
  getLocalGasPressure(x) {
    const A = this.geometry.getArea(x);
    const A_throat = this.geometry.getArea(
      this.geometry.L_chamber + this.geometry.L_convergent
    );
    
    const section = this.geometry.getSection(x);
    
    if (section === 'chamber') {
      return this.P_chamber;
    }
    
    if (section === 'throat') {
      return this.P_chamber * 0.58; // Critical pressure ratio
    }
    
    // In nozzle, pressure drops
    const area_ratio = A / A_throat;
    const gamma = 1.25;
    const P_ratio = Math.pow(area_ratio, -gamma);
    return this.P_chamber * 0.58 * P_ratio;
  }
  
  /**
   * Get peak heat flux location and value
   */
  getPeakHeatFlux() {
    const maxFlux = Math.max(...this.results.heatFlux);
    const maxIndex = this.results.heatFlux.indexOf(maxFlux);
    return {
      position: this.results.axialPositions[maxIndex],
      value: maxFlux,
      valueMW: UNITS.heatFluxToMW(maxFlux),
    };
  }
  
  /**
   * Get maximum wall temperature
   */
  getMaxWallTemp() {
    const maxTemp = Math.max(...this.results.wallTempHot);
    const maxIndex = this.results.wallTempHot.indexOf(maxTemp);
    return {
      position: this.results.axialPositions[maxIndex],
      value: maxTemp,
      valueCelsius: UNITS.kelvinToCelsius(maxTemp),
    };
  }
  
  /**
   * Get coolant outlet temperature
   */
  getCoolantOutletTemp() {
    const outletTemp = this.results.coolantTemp[this.results.coolantTemp.length - 1];
    return {
      value: outletTemp,
      valueCelsius: UNITS.kelvinToCelsius(outletTemp),
    };
  }
  
  /**
   * Get summary statistics
   */
  getSummary() {
    const peakFlux = this.getPeakHeatFlux();
    const maxWall = this.getMaxWallTemp();
    const coolantOut = this.getCoolantOutletTemp();
    
    return {
      peakHeatFlux: peakFlux,
      maxWallTemp: maxWall,
      coolantOutletTemp: coolantOut,
      totalHeatTransfer: this.calculateTotalHeat(),
    };
  }
  
  /**
   * Calculate total heat transfer to coolant
   */
  calculateTotalHeat() {
    // Integrate heat flux over surface area
    let totalQ = 0;
    for (let i = 1; i < this.results.axialPositions.length; i++) {
      const dx = this.results.axialPositions[i] - this.results.axialPositions[i - 1];
      const R = this.geometry.getRadius(this.results.axialPositions[i]);
      const area = 2 * Math.PI * R * dx;
      const avgFlux = (this.results.heatFlux[i] + this.results.heatFlux[i - 1]) / 2;
      totalQ += avgFlux * area;
    }
    return totalQ; // Watts
  }
}

export default RegenerativeCoolingSolver;
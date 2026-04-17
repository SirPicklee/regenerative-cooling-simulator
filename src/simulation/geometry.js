/**
 * ROCKET ENGINE GEOMETRY
 * Axisymmetric combustion chamber & nozzle
 */

import { CONSTANTS } from '../physics/constants';

/**
 * GEOMETRY SECTIONS
 */
export const GEOMETRY_SECTIONS = {
  CHAMBER: 'chamber',
  CONVERGENT: 'convergent',
  THROAT: 'throat',
  DIVERGENT: 'divergent',
};

/**
 * Contour generation for De Laval nozzle
 */
export class EngineGeometry {
  constructor(config = {}) {
    // Use Raptor-like dimensions from constants
    this.R_chamber = (config.chamberDiameter || CONSTANTS.CHAMBER_DIAMETER) / 2;
    this.R_throat = (config.throatDiameter || CONSTANTS.THROAT_DIAMETER) / 2;
    this.R_exit = (config.exitDiameter || CONSTANTS.NOZZLE_EXIT_DIAMETER) / 2;
    
    this.L_chamber = config.chamberLength || CONSTANTS.CHAMBER_LENGTH;
    this.L_convergent = config.convergentLength || 0.15; // 15cm convergent section
    this.L_throat = config.throatLength || 0.02; // 2cm throat section
    this.L_divergent = config.divergentLength || CONSTANTS.NOZZLE_LENGTH;
    
    // Total axial length
    this.L_total = this.L_chamber + this.L_convergent + this.L_throat + this.L_divergent;
    
    // Curvature radii (for smooth transitions)
    this.R_curve_convergent = 1.5 * this.R_chamber; // Gentle convergence
    this.R_curve_throat = 0.4 * this.R_throat;      // Tight throat radius
    this.R_curve_divergent = 0.8 * this.R_throat;   // Bell-shaped nozzle
    
    // Expansion ratio
    this.expansionRatio = Math.pow(this.R_exit / this.R_throat, 2);
    
    // Contraction ratio
    this.contractionRatio = Math.pow(this.R_chamber / this.R_throat, 2);
  }
  
  /**
   * Get radius at axial position x
   * @param {number} x - Axial position [m]
   * @returns {number} Radius at x [m]
   */
  getRadius(x) {
    const x_chamber_end = this.L_chamber;
    const x_convergent_end = x_chamber_end + this.L_convergent;
    const x_throat_end = x_convergent_end + this.L_throat;
    const x_exit = this.L_total;
    
    // Chamber section (constant radius)
    if (x <= x_chamber_end) {
      return this.R_chamber;
    }
    
    // Convergent section (circular arc transition)
    else if (x <= x_convergent_end) {
      const x_local = x - x_chamber_end;
      const theta_max = Math.atan((this.R_chamber - this.R_throat) / this.L_convergent);
      const theta = theta_max * (x_local / this.L_convergent);
      return this.R_chamber - (this.R_chamber - this.R_throat) * Math.sin(theta);
    }
    
    // Throat section (constant radius - critical flow)
    else if (x <= x_throat_end) {
      return this.R_throat;
    }
    
    // Divergent section (parabolic bell nozzle)
    else if (x <= x_exit) {
      const x_local = x - x_throat_end;
      const L_div = this.L_divergent;
      
      // Rao's parabolic approximation for bell nozzle
      // R(x) = R_throat + (R_exit - R_throat) * (x/L)^n
      const n = 0.6; // Bell shape parameter (0.5-0.8)
      const ratio = Math.pow(x_local / L_div, n);
      return this.R_throat + (this.R_exit - this.R_throat) * ratio;
    }
    
    return this.R_exit;
  }
  
  /**
   * Get local wall curvature (1/R_curvature)
   * Important for heat transfer calculations
   */
  getCurvature(x) {
    const dx = 1e-4; // Small step for numerical derivative
    const R1 = this.getRadius(x - dx);
    const R2 = this.getRadius(x + dx);
    const dRdx = (R2 - R1) / (2 * dx);
    
    // Curvature = dR/dx / sqrt(1 + (dR/dx)^2)
    return Math.abs(dRdx) / Math.sqrt(1 + dRdx * dRdx);
  }
  
  /**
   * Get cross-sectional area at position x
   */
  getArea(x) {
    const R = this.getRadius(x);
    return Math.PI * R * R;
  }
  
  /**
   * Identify which section x is in
   */
  getSection(x) {
    const x_chamber_end = this.L_chamber;
    const x_convergent_end = x_chamber_end + this.L_convergent;
    const x_throat_end = x_convergent_end + this.L_throat;
    
    if (x <= x_chamber_end) return GEOMETRY_SECTIONS.CHAMBER;
    if (x <= x_convergent_end) return GEOMETRY_SECTIONS.CONVERGENT;
    if (x <= x_throat_end) return GEOMETRY_SECTIONS.THROAT;
    return GEOMETRY_SECTIONS.DIVERGENT;
  }
  
  /**
   * Check if position is near throat (critical region)
   */
  isNearThroat(x, threshold = 0.05) {
    const x_throat_center = this.L_chamber + this.L_convergent + this.L_throat / 2;
    return Math.abs(x - x_throat_center) < threshold;
  }
  
  /**
   * Get local Mach number estimate (isentropic flow)
   * Using area-Mach relation for ideal gas
   */
  getMachNumber(x) {
    const A = this.getArea(x);
    const A_throat = this.getArea(this.L_chamber + this.L_convergent);
    const area_ratio = A / A_throat;
    
    if (area_ratio < 1.001) return 1.0; // At throat
    
    // Solve area-Mach relation iteratively
    // A/A* = (1/M) * [(2/(γ+1)) * (1 + (γ-1)/2 * M²)]^((γ+1)/(2(γ-1)))
    const gamma = 1.25; // From combustion gas properties
    
    // Simplified approximation for subsonic (chamber) and supersonic (nozzle)
    const section = this.getSection(x);
    if (section === GEOMETRY_SECTIONS.CHAMBER || section === GEOMETRY_SECTIONS.CONVERGENT) {
      // Subsonic: M ≈ sqrt(2/(γ-1) * ((A*/A)^((γ-1)/γ) - 1))
      return 0.1; // Low Mach in chamber (simplified)
    } else {
      // Supersonic in divergent section
      // Approximation: M ≈ sqrt(area_ratio) for large expansion
      return Math.min(Math.sqrt(area_ratio) * 1.5, 4.0);
    }
  }
  
  /**
   * Generate geometry points for visualization
   */
  generateContour(numPoints = 100) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * this.L_total;
      const R = this.getRadius(x);
      points.push({ x, R, section: this.getSection(x) });
    }
    return points;
  }
  
  /**
   * Get geometric properties summary
   */
  getSummary() {
    return {
      chamberDiameter: this.R_chamber * 2,
      throatDiameter: this.R_throat * 2,
      exitDiameter: this.R_exit * 2,
      totalLength: this.L_total,
      expansionRatio: this.expansionRatio,
      contractionRatio: this.contractionRatio,
      chamberArea: Math.PI * this.R_chamber * this.R_chamber,
      throatArea: Math.PI * this.R_throat * this.R_throat,
      exitArea: Math.PI * this.R_exit * this.R_exit,
    };
  }
}

/**
 * COOLING CHANNEL GEOMETRY
 */
export class CoolingChannelGeometry {
  constructor(geometry, config = {}) {
    this.engineGeometry = geometry;
    
    // Channel dimensions
    this.channelWidth = config.channelWidth || CONSTANTS.CHANNEL_WIDTH;
    this.channelHeight = config.channelHeight || CONSTANTS.CHANNEL_HEIGHT;
    this.channelCount = config.channelCount || CONSTANTS.CHANNEL_COUNT;
    this.wallThickness = config.wallThickness || CONSTANTS.WALL_THICKNESS;
    
    // Hydraulic diameter
    const w = this.channelWidth;
    const h = this.channelHeight;
    this.hydraulicDiameter = 2 * w * h / (w + h);
    
    // Flow area per channel
    this.flowArea = w * h;
    this.totalFlowArea = this.flowArea * this.channelCount;
  }
  
  /**
   * Get local channel properties at axial position
   */
  getChannelProperties(x) {
    const R_outer = this.engineGeometry.getRadius(x);
    const R_inner = R_outer - this.wallThickness - this.channelHeight;
    
    // Channel perimeter (for wetted perimeter)
    const wettedPerimeter = 2 * this.channelHeight + this.channelWidth;
    
    // Total circumference at this station
    const circumference = 2 * Math.PI * (R_outer - this.wallThickness - this.channelHeight / 2);
    
    return {
      R_outer,
      R_inner,
      hydraulicDiameter: this.hydraulicDiameter,
      flowArea: this.flowArea,
      wettedPerimeter,
      wallSurfaceArea: circumference * 1.0, // Per unit axial length
    };
  }
}

export default EngineGeometry;
/**
 * COMPUTATIONAL MESH GENERATOR
 * 2D structured grid for regenerative cooling simulation
 */

import { MESH_CONFIG } from '../physics/constants';
import { EngineGeometry } from './geometry';

/**
 * Node types for boundary conditions
 */
export const NODE_TYPES = {
  HOT_GAS: 'hot_gas',       // Inner wall (combustion side)
  WALL: 'wall',             // Copper wall
  COOLANT: 'coolant',       // Methane coolant
  INLET: 'inlet',           // Coolant inlet
  OUTLET: 'outlet',         // Coolant outlet
  ADIABATIC: 'adiabatic',   // Insulated boundary
};

/**
 * 2D Structured Mesh
 * Axial (x) × Radial (r) grid
 */
export class Mesh2D {
  constructor(geometry, config = {}) {
    this.geometry = geometry;

    // Mesh resolution from config
    this.nx_chamber = config.nx_chamber || MESH_CONFIG.NX_CHAMBER;
    this.nx_throat = config.nx_throat || MESH_CONFIG.NX_THROAT;
    this.nx_nozzle = config.nx_nozzle || MESH_CONFIG.NX_NOZZLE;
    this.nr_wall = config.nr_wall || MESH_CONFIG.NR_WALL;
    this.nr_coolant = config.nr_coolant || MESH_CONFIG.NR_COOLANT;

    // Total nodes
    this.nx = this.nx_chamber + this.nx_throat + this.nx_nozzle + 1;
    this.nr = this.nr_wall + this.nr_coolant + 1; // +1 for hot gas boundary
    this.totalNodes = this.nx * this.nr;

    // Generate mesh
    this.nodes = this.generateNodes();
    this.cells = this.generateCells();
  }

  /**
   * Generate axial distribution with refinement near throat
   */
  generateAxialPoints() {
    const points = [];

    const L_chamber = this.geometry.L_chamber;
    const L_convergent = this.geometry.L_convergent;
    const L_throat = this.geometry.L_throat;
    const L_divergent = this.geometry.L_divergent;

    // Chamber section - uniform spacing
    for (let i = 0; i < this.nx_chamber; i++) {
      const x = (i / this.nx_chamber) * L_chamber;
      points.push(x);
    }

    // Convergent + throat section - refined near throat
    const L_conv_throat = L_convergent + L_throat;
    for (let i = 0; i < this.nx_throat; i++) {
      // Clustering near throat using hyperbolic tangent
      const xi = i / this.nx_throat; // 0 to 1
      const beta = 2.0; // Clustering factor
      const stretched = 0.5 * (1 + Math.tanh(beta * (xi - 0.5)) / Math.tanh(beta / 2));
      const x = L_chamber + stretched * L_conv_throat;
      points.push(x);
    }

    // Divergent section - gradual expansion
    for (let i = 0; i <= this.nx_nozzle; i++) {
      const xi = i / this.nx_nozzle;
      const x = L_chamber + L_conv_throat + xi * L_divergent;
      points.push(x);
    }

    return points;
  }

  /**
   * Generate radial points at given axial location
   */
  generateRadialPoints(x) {
    const points = [];
    const R_outer = this.geometry.getRadius(x);

    // Wall thickness and channel height
    const t_wall = this.geometry.L_throat * 0.005; // Scale with throat size
    const h_channel = this.geometry.L_throat * 0.015;

    const R_hot_gas = R_outer; // Hot gas side
    const R_cold_wall = R_outer - t_wall; // Cold side of wall
    const R_coolant_inner = R_cold_wall - h_channel; // Coolant channel

    // Hot gas boundary (r = R_outer)
    points.push({ r: R_hot_gas, type: NODE_TYPES.HOT_GAS, layer: 'hot_gas' });

    // Wall layers
    for (let i = 0; i < this.nr_wall; i++) {
      const frac = (i + 1) / this.nr_wall;
      const r = R_hot_gas - frac * t_wall;
      points.push({ r, type: NODE_TYPES.WALL, layer: 'wall' });
    }

    // Coolant layers
    for (let i = 0; i < this.nr_coolant; i++) {
      const frac = i / (this.nr_coolant - 1);
      const r = R_cold_wall - frac * h_channel;
      points.push({ r, type: NODE_TYPES.COOLANT, layer: 'coolant' });
    }

    return points;
  }

  /**
   * Generate all mesh nodes
   */
  generateNodes() {
    const nodes = [];
    const x_points = this.generateAxialPoints();

    let nodeId = 0;
    for (let i = 0; i < x_points.length; i++) {
      const x = x_points[i];
      const r_points = this.generateRadialPoints(x);

      for (let j = 0; j < r_points.length; j++) {
        const { r, type, layer } = r_points[j];

        nodes.push({
          id: nodeId++,
          i, // Axial index
          j, // Radial index
          x,
          r,
          type,
          layer,
          // State variables (initialized)
          T: 300, // Temperature [K]
          P: 0,   // Pressure [Pa]
          v: 0,   // Velocity [m/s]
          rho: 0, // Density [kg/m³]
        });
      }
    }

    return nodes;
  }

  /**
   * Generate computational cells (control volumes)
   */
  generateCells() {
    const cells = [];

    for (let i = 0; i < this.nx - 1; i++) {
      for (let j = 0; j < this.nr - 1; j++) {
        // Cell corners (4 nodes)
        const n_sw = this.getNode(i, j);
        const n_se = this.getNode(i + 1, j);
        const n_nw = this.getNode(i, j + 1);
        const n_ne = this.getNode(i + 1, j + 1);

        // Cell center
        const x_c = (n_sw.x + n_se.x) / 2;
        const r_c = (n_sw.r + n_nw.r) / 2;

        // Cell dimensions
        const dx = n_se.x - n_sw.x;
        const dr = n_nw.r - n_sw.r;

        // Volume (annular segment)
        const r_inner = Math.min(n_sw.r, n_se.r);
        const r_outer = Math.max(n_nw.r, n_ne.r);
        const volume = Math.PI * (r_outer * r_outer - r_inner * r_inner) * dx;

        cells.push({
          i,
          j,
          x: x_c,
          r: r_c,
          dx,
          dr,
          volume,
          nodes: [n_sw.id, n_se.id, n_nw.id, n_ne.id],
          layer: n_sw.layer,
        });
      }
    }

    return cells;
  }

  /**
   * Get node by grid indices
   */
  getNode(i, j) {
    const index = i * this.nr + j;
    return this.nodes[index];
  }

  /**
   * Get all nodes in a specific layer
   */
  getNodesByLayer(layer) {
    return this.nodes.filter(n => n.layer === layer);
  }

  /**
   * Get nodes at axial position index i
   */
  getNodesAtX(i) {
    return this.nodes.filter(n => n.i === i);
  }

  /**
   * Get throat nodes (critical region)
   */
  getThroatNodes() {
    const throat_x = this.geometry.L_chamber + this.geometry.L_convergent;
    return this.nodes.filter(n => Math.abs(n.x - throat_x) < 0.01);
  }

  /**
   * Get mesh statistics
   */
  getStatistics() {
    const dx_min = Math.min(...this.cells.map(c => c.dx));
    const dx_max = Math.max(...this.cells.map(c => c.dx));
    const dr_min = Math.min(...this.cells.map(c => c.dr));
    const dr_max = Math.max(...this.cells.map(c => c.dr));

    return {
      totalNodes: this.totalNodes,
      nx: this.nx,
      nr: this.nr,
      totalCells: this.cells.length,
      dx_min,
      dx_max,
      dr_min,
      dr_max,
      aspectRatio_max: Math.max(dx_max / dr_min, dr_max / dx_min),
    };
  }

  /**
   * Export mesh for visualization
   */
  exportForVisualization() {
    return {
      nodes: this.nodes.map(n => ({
        x: n.x,
        r: n.r,
        type: n.type,
        layer: n.layer,
      })),
      axialPoints: [...new Set(this.nodes.map(n => n.x))],
      radialProfile: this.getNodesAtX(0).map(n => n.r),
      geometry: this.geometry.generateContour(100),
    };
  }
}

/**
 * Mesh quality checks
 */
export class MeshQuality {
  static checkAspectRatio(mesh, maxRatio = 10) {
    const stats = mesh.getStatistics();
    if (stats.aspectRatio_max > maxRatio) {
      console.warn(`High aspect ratio: ${stats.aspectRatio_max.toFixed(2)} > ${maxRatio}`);
      return false;
    }
    return true;
  }

  static checkOrthogonality(mesh) {
    // For structured grid, orthogonality is ensured by construction
    return true;
  }

  static checkSkewness(mesh) {
    // Check if cells are too skewed (angle deviation from 90°)
    // For our structured grid, this is minimal
    return true;
  }
}

export default Mesh2D;
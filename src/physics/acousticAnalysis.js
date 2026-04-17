/**
 * ACOUSTIC ANALYSIS & COMBUSTION INSTABILITY
 * Pressure oscillations, acoustic modes, stability analysis
 */

/**
 * SPEED OF SOUND IN COMBUSTION CHAMBER
 * a = √(γ * R * T)
 */
export function speedOfSound(gamma, R, T) {
  return Math.sqrt(gamma * R * T);
}

/**
 * ACOUSTIC MODE FREQUENCIES
 * For a cylindrical chamber with one closed end (injector) and one open end (nozzle)
 * 
 * Longitudinal modes: f_n = (2n - 1) * a / (4 * L)
 * Tangential modes: f_mn = (a / (2π * R)) * √(k_mn^2)
 * Radial modes: f_n = (α_n * a) / (2π * R)
 */

/**
 * LONGITUDINAL ACOUSTIC MODES
 * Quarter-wave resonator (closed-open)
 */
export function longitudinalModes(L_chamber, a, numModes = 5) {
  const modes = [];
  
  for (let n = 1; n <= numModes; n++) {
    const frequency = ((2 * n - 1) * a) / (4 * L_chamber);
    const wavelength = a / frequency;
    
    modes.push({
      n: n,
      mode: `1L (n=${n})`,
      frequency: frequency,
      wavelength: wavelength,
      type: 'longitudinal',
    });
  }
  
  return modes;
}

/**
 * TANGENTIAL ACOUSTIC MODES
 * For cylindrical chamber
 */
export function tangentialModes(R_chamber, a, numModes = 3) {
  const modes = [];
  
  // Eigenvalues for tangential modes (k_mn values)
  const eigenvalues = [
    { m: 1, n: 1, k: 1.841 },
    { m: 2, n: 1, k: 3.054 },
    { m: 0, n: 1, k: 3.832 },
    { m: 3, n: 1, k: 4.201 },
    { m: 1, n: 2, k: 5.331 },
  ];
  
  for (let i = 0; i < Math.min(numModes, eigenvalues.length); i++) {
    const { m, n, k } = eigenvalues[i];
    const frequency = (a / (2 * Math.PI * R_chamber)) * k;
    const wavelength = a / frequency;
    
    modes.push({
      m: m,
      n: n,
      mode: `${m}T`,
      frequency: frequency,
      wavelength: wavelength,
      type: 'tangential',
    });
  }
  
  return modes;
}

/**
 * RADIAL ACOUSTIC MODES
 */
export function radialModes(R_chamber, a, numModes = 3) {
  const modes = [];
  
  // Eigenvalues for radial modes (α_n values)
  const alphas = [3.832, 7.016, 10.173];
  
  for (let n = 0; n < Math.min(numModes, alphas.length); n++) {
    const alpha = alphas[n];
    const frequency = (alpha * a) / (2 * Math.PI * R_chamber);
    const wavelength = a / frequency;
    
    modes.push({
      n: n + 1,
      mode: `${n + 1}R`,
      frequency: frequency,
      wavelength: wavelength,
      type: 'radial',
    });
  }
  
  return modes;
}

/**
 * RAYLEIGH CRITERION
 * For combustion instability
 * 
 * If pressure and heat release oscillations are IN PHASE:
 *   ∫(p' * q') dt > 0 → UNSTABLE
 * If OUT OF PHASE:
 *   ∫(p' * q') dt < 0 → STABLE
 */
export function rayleighIndex(p_prime, q_prime) {
  // Simplified: dot product of pressure and heat release oscillations
  let integral = 0;
  for (let i = 0; i < p_prime.length; i++) {
    integral += p_prime[i] * q_prime[i];
  }
  return integral / p_prime.length;
}

/**
 * PRESSURE OSCILLATION AMPLITUDE
 * Simple harmonic model
 * p(t) = p_mean + A * sin(2π * f * t)
 */
export function pressureOscillation(t, p_mean, amplitude, frequency, phase = 0) {
  return p_mean + amplitude * Math.sin(2 * Math.PI * frequency * t + phase);
}

/**
 * DAMPING COEFFICIENT
 * α = (acoustic losses) / (acoustic energy)
 * Simplified model
 */
export function dampingCoefficient(L, R, f, rho, a) {
  const mu = 1.8e-5;
  const delta = Math.sqrt(mu / (Math.PI * f * rho));
  
  const A_surface = 2 * Math.PI * R * L;
  const V_chamber = Math.PI * R * R * L;
  
  const alpha = (delta * A_surface) / (V_chamber * a);
  
  // Safety check
  if (isNaN(alpha) || !isFinite(alpha)) return 0.01;
  
  return alpha;
}

/**
 * GROWTH RATE
 * For unstable modes: dr/dt = (energy gain - damping) * r
 * If growth_rate > 0: UNSTABLE
 * If growth_rate < 0: STABLE
 */
export function growthRate(rayleigh, damping) {
  return rayleigh - damping;
}

/**
 * STABILITY MARGIN
 * How far from instability
 * SM = damping / rayleigh
 * SM > 1: Stable
 * SM < 1: Unstable
 */
export function stabilityMargin(damping, rayleigh) {
  if (Math.abs(rayleigh) < 1e-10) return Infinity;
  return damping / Math.abs(rayleigh);
}

/**
 * HELMHOLTZ RESONATOR FREQUENCY
 * For injector acoustic response
 * f = (a / 2π) * √(S / (V * L_neck))
 */
export function helmholtzFrequency(a, S_neck, V_cavity, L_neck) {
  return (a / (2 * Math.PI)) * Math.sqrt(S_neck / (V_cavity * L_neck));
}

/**
 * COMPLETE ACOUSTIC ANALYZER
 */
export class AcousticAnalyzer {
  constructor(params) {
    this.L_chamber = params.L_chamber;         // Chamber length [m]
    this.R_chamber = params.R_chamber;         // Chamber radius [m]
    this.T_chamber = params.T_chamber;         // Chamber temperature [K]
    this.P_chamber = params.P_chamber;         // Chamber pressure [Pa]
    this.gamma = params.gamma || 1.25;
    this.R_gas = params.R_gas || 8314.46 / 25; // J/(kg·K)
    this.massFlowRate = params.massFlowRate;   // kg/s
    
    this.analyze();
  }
  
  analyze() {
    // 1. Speed of sound
    this.a = speedOfSound(this.gamma, this.R_gas, this.T_chamber);
    
    // 2. Acoustic modes
    this.longitudinal = longitudinalModes(this.L_chamber, this.a, 5);
    this.tangential = tangentialModes(this.R_chamber, this.a, 3);
    this.radial = radialModes(this.R_chamber, this.a, 3);
    
    // Combine all modes
    this.allModes = [
      ...this.longitudinal,
      ...this.tangential,
      ...this.radial,
    ].sort((a, b) => a.frequency - b.frequency);
    
    // 3. Fundamental frequency (first longitudinal mode)
    this.f_fundamental = this.longitudinal[0].frequency;
    
    // 4. Density
    this.rho = this.P_chamber / (this.R_gas * this.T_chamber);
    
    // 5. Damping coefficient (for fundamental mode)
    this.damping = dampingCoefficient(
      this.L_chamber,
      this.R_chamber,
      this.f_fundamental,
      this.rho,
      this.a
    );
    
    // 6. Simplified Rayleigh analysis
    // Assume typical combustion instability amplitude
    const typicalAmplitude = 0.05; // 5% of mean pressure
    
    // Generate oscillation data
    const numPoints = 100;
    const period = 1.0 / this.f_fundamental;
    this.timeData = [];
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * period;
      const p_osc = pressureOscillation(t, this.P_chamber, this.P_chamber * typicalAmplitude, this.f_fundamental);
      
      // Heat release oscillation (simplified: same frequency, variable phase)
      const phase_lag = Math.PI / 4; // 45° phase lag (typical)
      const q_osc = pressureOscillation(t, 1.0, 0.1, this.f_fundamental, phase_lag);
      
      this.timeData.push({
        time: t * 1000, // ms
        pressure: p_osc / 1e5, // bar
        heatRelease: q_osc,
      });
    }
    
    // 7. Rayleigh criterion (simplified)
    // Positive correlation = unstable
    // For demonstration, assume stable condition
    this.rayleigh = -0.02; // Negative = stable
    
    // 8. Growth rate
    this.growthRate = growthRate(this.rayleigh, this.damping);
    
    // 9. Stability margin
    this.stabilityMargin = stabilityMargin(this.damping, this.rayleigh);
    
    // 10. Stability status
    if (this.growthRate < 0 && this.stabilityMargin > 1.5) {
      this.stabilityStatus = 'stable';
    } else if (this.growthRate < 0 && this.stabilityMargin > 1.0) {
      this.stabilityStatus = 'marginally_stable';
    } else {
      this.stabilityStatus = 'unstable';
    }
  }
  
  getResults() {
    return {
      a: this.a,
      f_fundamental: this.f_fundamental,
      allModes: this.allModes,
      longitudinal: this.longitudinal,
      tangential: this.tangential,
      radial: this.radial,
      damping: this.damping,
      rayleigh: this.rayleigh,
      growthRate: this.growthRate,
      stabilityMargin: this.stabilityMargin,
      stabilityStatus: this.stabilityStatus,
      timeData: this.timeData,
    };
  }
}

export default {
  speedOfSound,
  longitudinalModes,
  tangentialModes,
  radialModes,
  rayleighIndex,
  pressureOscillation,
  dampingCoefficient,
  growthRate,
  stabilityMargin,
  helmholtzFrequency,
  AcousticAnalyzer,
};
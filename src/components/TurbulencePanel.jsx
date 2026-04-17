import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter } from 'recharts';
import { KEpsilonModel, estimateTurbulenceIntensity } from '../physics/turbulence';
import { MaterialHelpers } from '../physics/materials';

/**
 * TURBULENCE MODELING PANEL
 * k-epsilon turbulence model analysis
 */
export default function TurbulencePanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze turbulence at each axial position
  const turbulenceAnalysis = [];
  const axialPositions = fullThermalResults.axialPositions;
  
  for (let i = 0; i < axialPositions.length; i++) {
    const x = axialPositions[i];
    const T_gas = fullThermalResults.gasTemp[i];
    const T_coolant = fullThermalResults.coolantTemp[i];
    
    // Get gas properties
    const P_gas = simParams.chamberPressure * 1e5; // Convert to Pa
    const gasProps = MaterialHelpers.getGasProperties(T_gas, P_gas);
    
    // Estimate velocity from Mach number
    const M = geometry.getMachNumber(x);
    const gamma = 1.25;
    const R_specific = 8314.46 / 25; // J/(kg·K)
    const a = Math.sqrt(gamma * R_specific * T_gas); // Speed of sound
    const U_mean = M * a;
    
    // Get geometry properties
    const radius = geometry.getRadius(x);
    const D_h = radius * 2; // Hydraulic diameter
    
    // Calculate Reynolds number
    const Re = (gasProps.rho * U_mean * D_h) / gasProps.mu;
    
    // Estimate turbulence intensity
    const turbIntensity = estimateTurbulenceIntensity(Re);
    
    // Create k-epsilon model
    const keModel = new KEpsilonModel({
      U_mean: U_mean,
      L_ref: D_h,
      rho: gasProps.rho,
      mu: gasProps.mu,
      cp: gasProps.cp,
      k_laminar: gasProps.k,
      turbIntensity: turbIntensity,
      y_wall: 0.0001, // 0.1mm first cell
    });
    
    const turbResults = keModel.getResults();
    
    turbulenceAnalysis.push({
      position: (x * 100).toFixed(1), // cm
      x: x,
      Re: Re,
      U_mean: U_mean,
      k: turbResults.k,
      epsilon: turbResults.epsilon,
      mu_t: turbResults.mu_t,
      mu_eff: turbResults.mu_eff,
      k_t: turbResults.k_t,
      k_eff: turbResults.k_eff,
      tau_t: turbResults.tau_t,
      L_t: turbResults.L_t * 1000, // Convert to mm
      L_integral: turbResults.L_integral * 1000, // mm
      eta: turbResults.eta * 1e6, // Convert to μm (Kolmogorov micro-scale)
      tau_eta: turbResults.tau_eta * 1e6, // Convert to μs
      u_eta: turbResults.u_eta,
      Re_t: turbResults.Re_t,
      viscosityRatio: turbResults.viscosityRatio,
      turbIntensity: turbResults.turbIntensity,
      y_plus: turbResults.wall.y_plus,
      k_wall: turbResults.wall.k_wall,
      epsilon_wall: turbResults.wall.epsilon_wall,
    });
  }
  
  // Find throat analysis
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = turbulenceAnalysis.findIndex(item => Math.abs(item.x - throatX) < 0.01);
  const throatTurb = turbulenceAnalysis[throatIndex] || turbulenceAnalysis[Math.floor(turbulenceAnalysis.length / 2)];
  
  // Overall averages
  const avgK = turbulenceAnalysis.reduce((sum, t) => sum + t.k, 0) / turbulenceAnalysis.length;
  const avgViscRatio = turbulenceAnalysis.reduce((sum, t) => sum + t.viscosityRatio, 0) / turbulenceAnalysis.length;
  const maxViscRatio = Math.max(...turbulenceAnalysis.map(t => t.viscosityRatio));

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff00ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🌀 Turbulence Modeling (k-ε)
      </h2>

      <div className="content-grid">
        {/* TURBULENT KINETIC ENERGY */}
        <div className="panel">
          <h2>⚡ Turbulent Kinetic Energy</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>k @ Throat</div>
              <div style={{ fontSize: '1.8rem', color: '#00ff00' }}>
                {throatTurb.k.toFixed(2)} m²/s²
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Kinetic energy of turbulent fluctuations
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Average k</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {avgK.toFixed(2)} m²/s²
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Turbulence Intensity</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {throatTurb.turbIntensity.toFixed(2)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                I = u' / U_mean
              </div>
            </div>
          </div>
        </div>

        {/* DISSIPATION RATE */}
        <div className="panel">
          <h2>🔥 Dissipation Rate</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>ε @ Throat</div>
              <div style={{ fontSize: '1.8rem', color: '#ff6b35' }}>
                {throatTurb.epsilon.toExponential(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                m²/s³ - Rate of energy dissipation
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Turbulent Time Scale</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(throatTurb.tau_t * 1e6).toFixed(2)} μs
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                τ_t = k / ε
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Kolmogorov Time Scale</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {throatTurb.tau_eta.toFixed(2)} μs
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Smallest eddy time scale
              </div>
            </div>
          </div>
        </div>

        {/* EDDY VISCOSITY */}
        <div className="panel">
          <h2>🌊 Eddy Viscosity</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>μ_t @ Throat</div>
              <div style={{ fontSize: '1.8rem', color: '#ff00ff' }}>
                {(throatTurb.mu_t * 1000).toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                mPa·s - Turbulent viscosity
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Viscosity Ratio</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700', fontWeight: 'bold' }}>
                {throatTurb.viscosityRatio.toFixed(1)}×
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                μ_t / μ_laminar
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Turbulent Re_t</div>
              <div style={{ fontSize: '1.2rem', color: '#00ff00' }}>
                {throatTurb.Re_t.toFixed(0)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Re_t = ρk²/(με)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LENGTH SCALES */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>📏 Turbulent Length Scales</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Integral Scale (L_t)</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {throatTurb.L_integral.toFixed(2)} mm
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Largest eddies (energy-containing)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Taylor Microscale</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatTurb.L_t.toFixed(2)} mm
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Inertial range
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Kolmogorov Scale (η)</div>
              <div style={{ fontSize: '1.2rem', color: '#ff00ff' }}>
                {throatTurb.eta.toFixed(2)} μm
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Smallest eddies (dissipative)
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🔬 Kolmogorov Microscales</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Length (η)</div>
              <div style={{ fontSize: '1.5rem', color: '#ff00ff' }}>
                {throatTurb.eta.toFixed(2)} μm
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                η = (ν³/ε)^(1/4)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Time (τ_η)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatTurb.tau_eta.toFixed(2)} μs
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                τ_η = (ν/ε)^(1/2)
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Velocity (u_η)</div>
              <div style={{ fontSize: '1.2rem', color: '#00ff00' }}>
                {throatTurb.u_eta.toFixed(2)} m/s
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                u_η = (νε)^(1/4)
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📊 Model Constants</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>C_μ:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>0.09</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>C_1ε:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>1.44</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>C_2ε:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>1.92</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>σ_k:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>1.0</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>σ_ε:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>1.3</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Pr_t:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>0.85</span>
            </div>
          </div>
        </div>
      </div>

      {/* TURBULENT KINETIC ENERGY DISTRIBUTION */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#00ff00', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          ⚡ Turbulent Kinetic Energy Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          k = 0.5 × (u'² + v'² + w'²)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={turbulenceAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'k (m²/s²)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #00ff00',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="k" 
              stroke="#00ff00" 
              strokeWidth={3}
              dot={false}
              name="k (m²/s²)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* DISSIPATION RATE DISTRIBUTION */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#ff6b35', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          🔥 Dissipation Rate Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ε = C_μ^(3/4) × k^(3/2) / L_t
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={turbulenceAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              scale="log"
              domain={['auto', 'auto']}
              tickFormatter={(value) => value.toExponential(1)}
              label={{ value: 'ε (m²/s³)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ff6b35',
                borderRadius: '4px',
                color: '#fff'
              }}
              formatter={(value) => value.toExponential(2)}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="epsilon" 
              stroke="#ff6b35" 
              strokeWidth={3}
              dot={false}
              name="ε (m²/s³)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* EDDY VISCOSITY DISTRIBUTION */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#ff00ff', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          🌊 Eddy Viscosity Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          μ_t = ρ × C_μ × k² / ε
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={turbulenceAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'μ_t (mPa·s)', angle: -90, position: 'insideLeft', fill: '#888' }}
              tickFormatter={(value) => (value * 1000).toFixed(2)}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ff00ff',
                borderRadius: '4px',
                color: '#fff'
              }}
              formatter={(value) => [(value * 1000).toFixed(2) + ' mPa·s', 'μ_t']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mu_t" 
              stroke="#ff00ff" 
              strokeWidth={3}
              dot={false}
              name="μ_t (Pa·s)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* VISCOSITY RATIO */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#ffd700', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          📈 Viscosity Ratio (μ_t / μ)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Ratio of turbulent to laminar viscosity
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={turbulenceAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Viscosity Ratio', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ffd700',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Bar dataKey="viscosityRatio" fill="#ffd700" name="μ_t / μ" />
          </BarChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#888'
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#fff' }}>
            k-ε Transport Equations:
          </div>
          <div style={{ fontFamily: 'monospace', color: '#ffd700', marginBottom: '0.5rem' }}>
            ∂k/∂t + U·∇k = ∇·[(ν + ν_t/σ_k)∇k] + P_k - ε
          </div>
          <div style={{ fontFamily: 'monospace', color: '#ffd700' }}>
            ∂ε/∂t + U·∇ε = ∇·[(ν + ν_t/σ_ε)∇ε] + (C_1ε P_k - C_2ε ε) ε/k
          </div>
        </div>
      </div>
    </div>
  );
}
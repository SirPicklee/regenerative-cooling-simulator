import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter } from 'recharts';
import { BoundaryLayerAnalyzer } from '../physics/boundaryLayer';
import { MaterialHelpers } from '../physics/materials';

/**
 * BOUNDARY LAYER ANALYSIS PANEL
 * Complete boundary layer calculations with visualization
 */
export default function BoundaryLayerPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze boundary layer at multiple axial positions
  const blAnalysis = [];
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
    const U_inf = M * a;
    
    // Create boundary layer analyzer
    const analyzer = new BoundaryLayerAnalyzer(
      x,
      U_inf,
      gasProps.rho,
      gasProps.mu,
      gasProps.Pr,
      1e5 // Re_critical for rocket chamber
    );
    
    const blResults = analyzer.getCompleteResults();
    
    blAnalysis.push({
      position: (x * 100).toFixed(1), // cm
      x: x,
      Re_x: blResults.Re_x,
      type: blResults.type,
      delta: blResults.delta * 1000, // Convert to mm
      delta_star: blResults.delta_star * 1000, // mm
      theta: blResults.theta * 1000, // mm
      H: blResults.H,
      Cf: blResults.Cf * 1000, // x1000 for better scale
      tau_w: blResults.tau_w,
      y_plus: blResults.wallAnalysis.y_plus,
      region: blResults.wallAnalysis.region,
    });
  }
  
  // Find throat position for marking
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = blAnalysis.findIndex(item => Math.abs(item.x - throatX) < 0.01);
  const throatBL = blAnalysis[throatIndex] || blAnalysis[Math.floor(blAnalysis.length / 2)];
  
  // Count laminar vs turbulent regions
  const laminarCount = blAnalysis.filter(bl => bl.type === 'laminar').length;
  const turbulentCount = blAnalysis.filter(bl => bl.type === 'turbulent').length;
  
  // Average values
  const avgDelta = blAnalysis.reduce((sum, bl) => sum + bl.delta, 0) / blAnalysis.length;
  const avgCf = blAnalysis.reduce((sum, bl) => sum + bl.Cf, 0) / blAnalysis.length;
  const avgH = blAnalysis.reduce((sum, bl) => sum + bl.H, 0) / blAnalysis.length;
  
  // Color by flow type
  const getFlowColor = (type) => {
    return type === 'laminar' ? '#00ff00' : '#ff6b35';
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00ff00', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🌊 Boundary Layer Analysis
      </h2>

      <div className="content-grid">
        {/* FLOW REGIME */}
        <div className="panel">
          <h2>🔬 Flow Regime</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat Region</div>
              <div style={{ 
                fontSize: '2rem', 
                color: throatBL.type === 'laminar' ? '#00ff00' : '#ff6b35',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {throatBL.type}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Re_x = {throatBL.Re_x.toExponential(2)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#00ff00' }}>Laminar Regions</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{laminarCount}</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(laminarCount / blAnalysis.length) * 100}%`, 
                  height: '100%', 
                  background: '#00ff00' 
                }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#ff6b35' }}>Turbulent Regions</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{turbulentCount}</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(turbulentCount / blAnalysis.length) * 100}%`, 
                  height: '100%', 
                  background: '#ff6b35' 
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* BOUNDARY LAYER THICKNESS */}
        <div className="panel">
          <h2>📏 Thickness Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>BL Thickness (δ) @ Throat</div>
              <div style={{ fontSize: '1.8rem', color: '#00d9ff' }}>
                {throatBL.delta.toFixed(3)} mm
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Displacement (δ*)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatBL.delta_star.toFixed(3)} mm
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Momentum (θ)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatBL.theta.toFixed(3)} mm
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Shape Factor (H)</div>
              <div style={{ fontSize: '1.2rem', color: avgH > 2.5 ? '#ff0000' : '#00ff00' }}>
                {throatBL.H.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {throatBL.H < 2.0 ? '✅ Healthy BL' : throatBL.H < 2.5 ? '⚠️ Moderate' : '❌ Near separation'}
              </div>
            </div>
          </div>
        </div>

        {/* WALL PROPERTIES */}
        <div className="panel">
          <h2>🧱 Wall Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Skin Friction (Cf)</div>
              <div style={{ fontSize: '1.8rem', color: '#ffd700' }}>
                {(throatBL.Cf).toFixed(4)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                x10⁻³
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Wall Shear Stress (τ_w)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(throatBL.tau_w / 1000).toFixed(2)} kPa
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>y+ (First Cell)</div>
              <div style={{ fontSize: '1.2rem', color: throatBL.y_plus < 1 ? '#00ff00' : throatBL.y_plus < 5 ? '#ffd700' : '#ff6b35' }}>
                {throatBL.y_plus.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Region: {throatBL.region.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REYNOLDS NUMBER DISTRIBUTION */}
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
          🔢 Reynolds Number Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Transition from laminar to turbulent flow
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={blAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              tickFormatter={(value) => (value / 1e6).toFixed(1) + 'M'}
              label={{ value: 'Reynolds Number (millions)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #00ff00',
                borderRadius: '4px',
                color: '#fff'
              }}
              formatter={(value, name) => {
                if (name === 'Re_x') return [value.toExponential(2), name];
                return [value, name];
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Re_x" 
              stroke="#00ff00" 
              strokeWidth={3}
              dot={false}
              name="Re_x"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BOUNDARY LAYER THICKNESS */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#00d9ff', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          📐 Boundary Layer Thickness Evolution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          δ (total), δ* (displacement), θ (momentum)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={blAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Thickness (mm)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #00d9ff',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="delta" 
              stroke="#00d9ff" 
              strokeWidth={3}
              dot={false}
              name="δ (BL Thickness)"
            />
            <Line 
              type="monotone" 
              dataKey="delta_star" 
              stroke="#ffd700" 
              strokeWidth={2}
              dot={false}
              name="δ* (Displacement)"
            />
            <Line 
              type="monotone" 
              dataKey="theta" 
              stroke="#ff00ff" 
              strokeWidth={2}
              dot={false}
              name="θ (Momentum)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SKIN FRICTION COEFFICIENT */}
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
          🎯 Skin Friction Coefficient (Cf)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Wall shear resistance - colored by flow type
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={blAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Cf (×10⁻³)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ffd700',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Bar dataKey="Cf" name="Skin Friction Coeff">
              {blAnalysis.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getFlowColor(entry.type)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          display: 'flex',
          gap: '1.5rem',
          fontSize: '0.75rem',
          color: '#888',
          justifyContent: 'center'
        }}>
          <div><span style={{ color: '#00ff00' }}>■</span> Laminar Flow</div>
          <div><span style={{ color: '#ff6b35' }}>■</span> Turbulent Flow</div>
        </div>
      </div>
    </div>
  );
}
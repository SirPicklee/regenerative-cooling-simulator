import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { CompressibleFlowAnalyzer, NormalShock, isentropicPressureRatio, isentropicTemperatureRatio, isentropicAreaRatio } from '../physics/compressibleFlow';

/**
 * COMPRESSIBLE FLOW ANALYSIS PANEL
 * Supersonic flow, isentropic relations, shock waves
 */
export default function CompressibleFlowPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze compressible flow at each position
  const flowAnalysis = [];
  const axialPositions = fullThermalResults.axialPositions;
  
  const gamma = 1.25; // Combustion products
  const R_specific = 8314.46 / 25; // J/(kg·K)
  
  for (let i = 0; i < axialPositions.length; i++) {
    const x = axialPositions[i];
    const M = geometry.getMachNumber(x);
    const T_gas = fullThermalResults.gasTemp[i];
    const P_chamber = simParams.chamberPressure * 1e5; // Pa
    const T_chamber = simParams.chamberTemp;
    
    // Create compressible flow analyzer
    const analyzer = new CompressibleFlowAnalyzer({
      M: M,
      T0: T_chamber,
      P0: P_chamber,
      gamma: gamma,
      R: R_specific,
    });
    
    const results = analyzer.getResults();
    
    // Calculate area ratio
    const area = geometry.getArea(x);
    const throatX = geometry.L_chamber + geometry.L_convergent;
    const A_throat = geometry.getArea(throatX);
    const areaRatio = area / A_throat;
    
    flowAnalysis.push({
      position: (x * 100).toFixed(1), // cm
      x: x,
      M: M,
      regime: results.regime,
      T: results.T,
      P: results.P / 1e5, // bar
      T_ratio: results.T_ratio,
      P_ratio: results.P_ratio,
      rho_ratio: results.rho_ratio,
      a: results.a, // m/s
      V: results.V, // m/s
      q: results.q / 1e3, // kPa
      M_star: results.M_star,
      areaRatio: areaRatio,
    });
  }
  
  // Find throat
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = flowAnalysis.findIndex(item => Math.abs(item.x - throatX) < 0.01);
  const throatFlow = flowAnalysis[throatIndex] || flowAnalysis[Math.floor(flowAnalysis.length / 2)];
  
  // Find exit
  const exitFlow = flowAnalysis[flowAnalysis.length - 1];
  
  // Detect shock (if any) - sudden Mach drop
  let shockDetected = false;
  let shockLocation = null;
  for (let i = 1; i < flowAnalysis.length; i++) {
    const dM = flowAnalysis[i].M - flowAnalysis[i - 1].M;
    if (dM < -0.5 && flowAnalysis[i - 1].M > 1.0) {
      shockDetected = true;
      shockLocation = flowAnalysis[i];
      break;
    }
  }
  
  // Calculate shock properties if detected
  let shockAnalysis = null;
  if (shockDetected && shockLocation) {
    try {
      const shock = new NormalShock(shockLocation.M, gamma);
      shockAnalysis = shock.getResults();
    } catch (e) {
      shockAnalysis = null;
    }
  }
  
  // Flow regime distribution
  const regimeCounts = {
    incompressible: flowAnalysis.filter(f => f.regime === 'incompressible').length,
    subsonic_compressible: flowAnalysis.filter(f => f.regime === 'subsonic_compressible').length,
    transonic: flowAnalysis.filter(f => f.regime === 'transonic').length,
    supersonic: flowAnalysis.filter(f => f.regime === 'supersonic').length,
    hypersonic: flowAnalysis.filter(f => f.regime === 'hypersonic').length,
  };
  
  // Regime colors
  const getRegimeColor = (regime) => {
    switch(regime) {
      case 'incompressible': return '#00ff00';
      case 'subsonic_compressible': return '#ffd700';
      case 'transonic': return '#ff6b35';
      case 'supersonic': return '#ff0000';
      case 'hypersonic': return '#ff00ff';
      default: return '#888';
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff0000', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🚀 Compressible Flow Analysis
      </h2>

      <div className="content-grid">
        {/* MACH NUMBER */}
        <div className="panel">
          <h2>💨 Mach Number</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat</div>
              <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                M = {throatFlow.M.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Sonic point (M = 1)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Exit</div>
              <div style={{ fontSize: '1.5rem', color: '#ff0000' }}>
                M = {exitFlow.M.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {exitFlow.regime}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Exit Velocity</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {exitFlow.V.toFixed(0)} m/s
              </div>
            </div>
          </div>
        </div>

        {/* ISENTROPIC RATIOS */}
        <div className="panel">
          <h2>📉 Isentropic Ratios</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Pressure Ratio (P/P₀)</div>
              <div style={{ fontSize: '1.5rem', color: '#ff6b35' }}>
                {exitFlow.P_ratio.toFixed(4)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                At exit
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Temperature Ratio (T/T₀)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {exitFlow.T_ratio.toFixed(4)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Density Ratio (ρ/ρ₀)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {exitFlow.rho_ratio.toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* FLOW REGIME */}
        <div className="panel">
          <h2>🌊 Flow Regime</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Supersonic Regions</div>
              <div style={{ fontSize: '2rem', color: '#ff0000', fontWeight: 'bold' }}>
                {regimeCounts.supersonic}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {((regimeCounts.supersonic / flowAnalysis.length) * 100).toFixed(1)}% of nozzle
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Subsonic Regions</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {regimeCounts.subsonic_compressible + regimeCounts.incompressible}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Transonic</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {regimeCounts.transonic}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHOCK DETECTION */}
      {shockDetected && shockAnalysis && (
        <div style={{ 
          background: '#0a0a0a', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '2px solid #ff0000',
          marginTop: '1.5rem'
        }}>
          <h3 style={{ 
            fontFamily: 'Orbitron', 
            color: '#ff0000', 
            marginBottom: '0.5rem',
            fontSize: '1.2rem'
          }}>
            ⚡ SHOCK WAVE DETECTED!
          </h3>
          
          <div className="content-grid" style={{ marginTop: '1rem' }}>
            <div className="panel">
              <h2>📍 Shock Location</h2>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                <div style={{ fontSize: '1.5rem', color: '#ff0000' }}>
                  {shockLocation.position} cm
                </div>
              </div>
            </div>
            
            <div className="panel">
              <h2>🔻 Mach Jump</h2>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                  M₁ = {shockAnalysis.M1.toFixed(2)} → M₂ = {shockAnalysis.M2.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="panel">
              <h2>📈 Pressure Jump</h2>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                  P₂/P₁ = {shockAnalysis.P_ratio.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MACH NUMBER DISTRIBUTION */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#ff0000', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          💨 Mach Number Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Acceleration from subsonic (chamber) to supersonic (nozzle)
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={flowAnalysis}>
            <defs>
              <linearGradient id="machGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff0000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ff0000" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Mach Number', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ff0000',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="M" 
              stroke="#ff0000" 
              fill="url(#machGradient)"
              strokeWidth={3}
              name="Mach Number"
            />
            {/* Sonic line */}
            <Line 
              type="monotone" 
              dataKey={() => 1.0} 
              stroke="#ffd700" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="M = 1 (Sonic)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ISENTROPIC RELATIONS */}
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
          📉 Isentropic Property Ratios
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          P/P₀, T/T₀, ρ/ρ₀ vs Mach number
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={flowAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="M" 
              stroke="#888"
              label={{ value: 'Mach Number', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              scale="log"
              domain={[0.001, 1]}
              label={{ value: 'Property Ratio', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="P_ratio" 
              stroke="#ff6b35" 
              strokeWidth={3}
              dot={false}
              name="P/P₀"
            />
            <Line 
              type="monotone" 
              dataKey="T_ratio" 
              stroke="#00d9ff" 
              strokeWidth={3}
              dot={false}
              name="T/T₀"
            />
            <Line 
              type="monotone" 
              dataKey="rho_ratio" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="ρ/ρ₀"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* VELOCITY DISTRIBUTION */}
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
          🚀 Velocity & Speed of Sound
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          V = M × a, where a = √(γRT)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={flowAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ffd700',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="V" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="Velocity (m/s)"
            />
            <Line 
              type="monotone" 
              dataKey="a" 
              stroke="#00ff00" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Speed of Sound (m/s)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AREA-MACH RELATION */}
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
          📐 Area-Mach Relation
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          A/A* = f(M) - Isentropic area ratio
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              type="number" 
              dataKey="M" 
              stroke="#888"
              domain={[0, 'auto']}
              label={{ value: 'Mach Number', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              type="number"
              dataKey="areaRatio"
              stroke="#888"
              label={{ value: 'A/A*', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ff00ff',
                borderRadius: '4px',
                color: '#fff'
              }}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Scatter 
              data={flowAnalysis} 
              fill="#ff00ff"
              name="Nozzle Profile"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
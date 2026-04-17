import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import { InjectorAnalyzer } from '../physics/injectorAtomization';

/**
 * INJECTOR DESIGN & SPRAY ATOMIZATION PANEL
 * SMD, Weber number, breakup regimes, mixing efficiency
 */
export default function InjectorPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Create injector analyzer
  const injector = new InjectorAnalyzer({
    injectorType: 'unlike-doublet',
    numInjectors: 120,
    D_orifice: 0.0008, // 0.8mm
    P_chamber: simParams.chamberPressure * 1e5,
    P_manifold: simParams.chamberPressure * 1.3e5, // 30% higher
    massFlowRate_total: simParams.massFlowRate,
    OF_ratio: 3.5,
  });
  
  const results = injector.getResults();
  
  // Breakup regime colors
  const getRegimeColor = (regime) => {
    const colors = {
      'no_breakup': '#888',
      'bag_breakup': '#ffd700',
      'multimode': '#ff6b35',
      'shear_breakup': '#ff00ff',
      'atomization': '#00ff00',
    };
    return colors[regime] || '#888';
  };
  
  // Quality colors
  const getQualityColor = (quality) => {
    const colors = {
      'excellent': '#00ff00',
      'good': '#00d9ff',
      'fair': '#ffd700',
      'poor': '#ff6b35',
    };
    return colors[quality] || '#888';
  };
  
  // Performance radar data
  const performanceData = [
    { metric: 'Atomization', value: results.SMD_ox < 100 ? 90 : 60, fullMark: 100 },
    { metric: 'Mixing', value: results.eta_mix * 100, fullMark: 100 },
    { metric: 'Penetration', value: Math.min(100, (results.L_penetration / 0.1) * 100), fullMark: 100 },
    { metric: 'Pressure Drop', value: Math.min(100, (results.deltaP / 5e5) * 100), fullMark: 100 },
    { metric: 'Spray Angle', value: (results.sprayAngle / 90) * 100, fullMark: 100 },
  ];
  
  // Droplet size comparison
  const dropletData = [
    { name: 'Oxidizer', SMD: results.SMD_ox, fill: '#0088ff' },
    { name: 'Fuel', SMD: results.SMD_fuel, fill: '#ff6b35' },
  ];
  
  // Weber number comparison
  const weberData = [
    { name: 'Oxidizer', We: results.We_ox, fill: '#0088ff' },
    { name: 'Fuel', We: results.We_fuel, fill: '#ff6b35' },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00ff00', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        💉 Injector Design & Spray Atomization
      </h2>

      <div className="content-grid">
        {/* DROPLET SIZE */}
        <div className="panel">
          <h2>💧 Droplet Size (SMD)</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Oxidizer (O₂)</div>
              <div style={{ fontSize: '2rem', color: getQualityColor(results.quality_ox), fontWeight: 'bold' }}>
                {results.SMD_ox.toFixed(1)} μm
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {results.quality_ox.toUpperCase()}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Fuel (CH₄)</div>
              <div style={{ fontSize: '1.5rem', color: getQualityColor(results.quality_fuel) }}>
                {results.SMD_fuel.toFixed(1)} μm
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {results.quality_fuel.toUpperCase()}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Average</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {((results.SMD_ox + results.SMD_fuel) / 2).toFixed(1)} μm
              </div>
            </div>
          </div>
        </div>

        {/* WEBER NUMBER */}
        <div className="panel">
          <h2>🌊 Weber Number</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Oxidizer</div>
              <div style={{ fontSize: '2rem', color: '#0088ff', fontWeight: 'bold' }}>
                {results.We_ox.toFixed(0)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                We = ρ·V²·D/σ
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Fuel</div>
              <div style={{ fontSize: '1.5rem', color: '#ff6b35' }}>
                {results.We_fuel.toFixed(0)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Breakup Regime</div>
              <div style={{ fontSize: '1.0rem', color: getRegimeColor(results.regime_ox), textTransform: 'uppercase' }}>
                {results.regime_ox.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* MIXING EFFICIENCY */}
        <div className="panel">
          <h2>🔄 Mixing Efficiency</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>η_mix</div>
              <div style={{ fontSize: '2.5rem', color: results.eta_mix > 0.8 ? '#00ff00' : results.eta_mix > 0.6 ? '#ffd700' : '#ff6b35', fontWeight: 'bold' }}>
                {(results.eta_mix * 100).toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {results.eta_mix > 0.8 ? 'Excellent' : results.eta_mix > 0.6 ? 'Good' : 'Fair'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Spray Angle</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.sprayAngle.toFixed(1)}°
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Penetration Depth</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(results.L_penetration * 100).toFixed(1)} cm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INJECTION PARAMETERS */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>⚙️ Injection Parameters</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Pressure Drop (ΔP)</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {(results.deltaP / 1e5).toFixed(1)} bar
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Oxidizer Velocity</div>
              <div style={{ fontSize: '1.2rem', color: '#0088ff' }}>
                {results.V_ox.toFixed(1)} m/s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Fuel Velocity</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {results.V_fuel.toFixed(1)} m/s
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🎯 Injector Configuration</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Type</div>
              <div style={{ fontSize: '1.2rem', color: '#fff', textTransform: 'uppercase' }}>
                UNLIKE-DOUBLET
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Number of Injectors</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                120
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Orifice Diameter</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                0.80 mm
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🔬 Advanced Parameters</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Impingement Angle</div>
              <div style={{ fontSize: '1.5rem', color: '#00ff00' }}>
                {results.impingementAngle}°
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Discharge Coeff (Cd)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.Cd.toFixed(3)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Ohnesorge Number</div>
              <div style={{ fontSize: '1.2rem', color: '#ff00ff' }}>
                {results.Oh_ox.toExponential(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DROPLET SIZE COMPARISON */}
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
          💧 Sauter Mean Diameter (D32) Comparison
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Volume/Surface area mean diameter - smaller is better for combustion
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dropletData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="name" 
              stroke="#888"
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'SMD (μm)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Bar dataKey="SMD" name="SMD (μm)">
              {dropletData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
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
            Quality Guide:
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div><span style={{ color: '#00ff00' }}>●</span> Excellent: &lt;50 μm</div>
            <div><span style={{ color: '#00d9ff' }}>●</span> Good: 50-100 μm</div>
            <div><span style={{ color: '#ffd700' }}>●</span> Fair: 100-200 μm</div>
            <div><span style={{ color: '#ff6b35' }}>●</span> Poor: &gt;200 μm</div>
          </div>
        </div>
      </div>

      {/* WEBER NUMBER CHART */}
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
          🌊 Weber Number & Breakup Regimes
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          We = ρ·V²·D/σ - determines breakup mechanism
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weberData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              type="number"
              stroke="#888"
              label={{ value: 'Weber Number', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="#888"
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
            <Bar dataKey="We" name="Weber Number">
              {weberData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
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
            Breakup Regimes:
          </div>
          <div>• We &lt; 12: No breakup</div>
          <div>• We 12-50: Bag breakup</div>
          <div>• We 50-100: Multimode</div>
          <div>• We 100-350: Shear breakup</div>
          <div>• We &gt; 350: Atomization</div>
        </div>
      </div>

      {/* PERFORMANCE RADAR */}
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
          📊 Injector Performance Map
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Multi-dimensional performance assessment
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={performanceData}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="metric" stroke="#888" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#888" />
            <Radar 
              name="Performance" 
              dataKey="value" 
              stroke="#00ff00" 
              fill="#00ff00" 
              fillOpacity={0.3}
              strokeWidth={3}
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
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* EQUATIONS */}
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
          📐 Atomization Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Sauter Mean Diameter:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              SMD = C·(σ/ρ_g)^0.5·(μ_l/ρ_l)^0.25·(ΔP)^(-0.5)·(ṁ/A)^(-0.25)
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Weber Number:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              We = ρ·V²·D / σ
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Mixing Efficiency:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              η_mix = f(SMD, spray_angle, turbulence)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { FilmCoolingAnalyzer } from '../physics/filmCooling';

/**
 * FILM COOLING EFFECTIVENESS PANEL
 * Protective film layer analysis
 */
export default function FilmCoolingPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze film cooling at throat region (highest heat flux)
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = Math.floor(fullThermalResults.gasTemp.length / 2);
  
  const T_gas = fullThermalResults.gasTemp[throatIndex];
  const T_coolant = simParams.coolantInletTemp;
  
  // Gas properties at throat
  const P_chamber = simParams.chamberPressure * 1e5;
  const R_gas = 8314.46 / 25;
  const rho_gas = P_chamber / (R_gas * T_gas);
  const V_gas = 300; // m/s approximate at throat
  
  // Coolant properties (methane)
  const rho_coolant = 422; // kg/m³
  // Adaptive film cooling velocity based on gas velocity
  // Target blowing ratio: M = 0.5-1.0 for optimal effectiveness
  // M = (rho_c * V_c) / (rho_g * V_gas)
  // V_c = M_target * (rho_g * V_gas) / rho_c
  const M_target = 0.8; // Optimal blowing ratio
  const V_coolant = (M_target * rho_gas * V_gas) / rho_coolant;
  
  // Create film cooling analyzer
  const film = new FilmCoolingAnalyzer({
    T_gas: T_gas,
    T_coolant: T_coolant,
    rho_gas: rho_gas,
    rho_coolant: rho_coolant,
    V_gas: V_gas,
    V_coolant: V_coolant,
    numHoles: 60,
    d_hole: 0.0005, // 0.5mm
    length: 0.05, // 5cm
  });
  
  const results = film.getResults();
  
  // Regime color
  const getRegimeColor = (regime) => {
    const colors = {
      'low_blowing': '#ffd700',
      'optimal': '#00ff00',
      'high_blowing': '#ff6b35',
      'jet_liftoff': '#ff0000',
    };
    return colors[regime] || '#888';
  };
  
  // Effectiveness data for chart
  const effectivenessData = results.effectiveness.map(item => ({
    x_d: item.x_d,
    x_mm: item.x,
    eta: (item.eta * 100).toFixed(1),
    T_film: item.T_film.toFixed(1),
    q_reduction: (item.q_reduction * 100).toFixed(1),
  }));
  
  // Performance bars
  const performanceData = [
    { name: 'Effectiveness', value: results.eta_avg * 100, fill: '#00ff00' },
    { name: 'Coverage', value: results.coverage * 100, fill: '#00d9ff' },
    { name: 'Heat Flux Reduction', value: results.q_reduction_avg * 100, fill: '#ffd700' },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00d9ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🛡️ Film Cooling Effectiveness
      </h2>

      <div className="content-grid">
        {/* EFFECTIVENESS */}
        <div className="panel">
          <h2>📊 Effectiveness (η)</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Average η</div>
              <div style={{ fontSize: '2rem', color: results.eta_avg > 0.6 ? '#00ff00' : results.eta_avg > 0.3 ? '#ffd700' : '#ff6b35', fontWeight: 'bold' }}>
                {(results.eta_avg * 100).toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                η = (T_∞ - T_aw) / (T_∞ - T_c)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Temperature Reduction</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.deltaT_reduction.toFixed(0)} K
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Film Temperature</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {results.T_film_avg.toFixed(0)} K
              </div>
            </div>
          </div>
        </div>

        {/* BLOWING RATIO */}
        <div className="panel">
          <h2>💨 Blowing Ratio (M)</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>M</div>
              <div style={{ fontSize: '2rem', color: getRegimeColor(results.regime), fontWeight: 'bold' }}>
                {results.M.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                M = (ρ_c·V_c) / (ρ_∞·V_∞)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Regime</div>
              <div style={{ 
                fontSize: '1.0rem', 
                color: getRegimeColor(results.regime),
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                {results.regime.replace('_', ' ')}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Momentum Flux Ratio (I)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.I.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* COVERAGE */}
        <div className="panel">
          <h2>🎯 Coverage Area</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Wall Coverage</div>
              <div style={{ fontSize: '2rem', color: results.coverage > 0.8 ? '#00ff00' : results.coverage > 0.5 ? '#ffd700' : '#ff6b35', fontWeight: 'bold' }}>
                {(results.coverage * 100).toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Protected area
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Number of Holes</div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                60
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Hole Diameter</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                0.50 mm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADDITIONAL PARAMETERS */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>🌡️ Thermal Protection</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Heat Flux Reduction</div>
              <div style={{ fontSize: '1.5rem', color: '#00ff00' }}>
                {((1 - results.q_reduction_avg) * 100).toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                q_film/q_0 = {results.q_reduction_avg.toFixed(2)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Gas Temperature</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {T_gas.toFixed(0)} K
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Coolant Temperature</div>
              <div style={{ fontSize: '1.2rem', color: '#0088ff' }}>
                {T_coolant.toFixed(0)} K
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🔬 Flow Parameters</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Density Ratio (DR)</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {results.DR.toFixed(1)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Coolant Velocity</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                40 m/s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Film Penetration</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(results.y_film * 1000).toFixed(2)} mm
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📐 Geometry</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Injection Location</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                Throat Region
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Injection Angle</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                30°
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Tangential injection
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Hole Spacing</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                2.0 mm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EFFECTIVENESS DECAY */}
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
          📉 Film Effectiveness Decay
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Effectiveness decreases with downstream distance (x/d)
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={effectivenessData}>
            <defs>
              <linearGradient id="etaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff00" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00ff00" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="x_d" 
              stroke="#888"
              label={{ value: 'x/d (Downstream Distance)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              yAxisId="eta"
              stroke="#888"
              domain={[0, 100]}
              label={{ value: 'Effectiveness (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="temp"
              orientation="right"
              stroke="#888"
              label={{ value: 'Film Temperature (K)', angle: 90, position: 'insideRight', fill: '#888' }}
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
            <Area 
              yAxisId="eta"
              type="monotone" 
              dataKey="eta" 
              stroke="#00ff00" 
              fill="url(#etaGradient)"
              strokeWidth={3}
              name="Effectiveness (%)"
            />
            <Line 
              yAxisId="temp"
              type="monotone" 
              dataKey="T_film" 
              stroke="#ff6b35" 
              strokeWidth={3}
              dot={false}
              name="Film Temp (K)"
            />
          </ComposedChart>
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
            Decay Mechanism:
          </div>
          <div>• Film mixes with hot gas → effectiveness decreases</div>
          <div>• Turbulent diffusion spreads coolant</div>
          <div>• Effectiveness ∝ (x/d)^(-0.5) empirically</div>
        </div>
      </div>

      {/* HEAT FLUX REDUCTION */}
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
          🔥 Heat Flux Reduction Profile
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          q_film / q_no_film = 1 - η
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={effectivenessData}>
            <defs>
              <linearGradient id="qGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffd700" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffd700" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="x_mm" 
              stroke="#888"
              label={{ value: 'Downstream Distance (mm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              domain={[0, 100]}
              label={{ value: 'Heat Flux Reduction (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Area 
              type="monotone" 
              dataKey="q_reduction" 
              stroke="#ffd700" 
              fill="url(#qGradient)"
              strokeWidth={3}
              name="Heat Flux Reduction (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* PERFORMANCE SUMMARY */}
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
          📊 Film Cooling Performance Summary
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="name" 
              stroke="#888"
            />
            <YAxis 
              stroke="#888"
              domain={[0, 100]}
              label={{ value: 'Performance (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Bar dataKey="value" name="Performance (%)">
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
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
          📐 Film Cooling Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Adiabatic Effectiveness:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              η = (T_∞ - T_aw) / (T_∞ - T_c)
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Blowing Ratio:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              M = (ρ_c·V_c) / (ρ_∞·V_∞)
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Effectiveness Decay:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              η ∝ (x/d)^(-0.5) · f(M, DR)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
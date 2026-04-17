import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { NozzleOptimizationAnalyzer } from '../physics/nozzleOptimization';

/**
 * NOZZLE SHAPE OPTIMIZATION PANEL
 * Optimal contour design and performance
 */
export default function NozzleOptimizationPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Nozzle parameters
  const gamma = 1.2;
  const R = 8314.46 / 25; // CH4/O2 mix [J/(kg·K)]
  const T_c = simParams.chamberTemp;
  const P_c = simParams.chamberPressure * 1e5;
  const P_amb = 1e5; // Sea level
  const R_t = geometry.throatDiameter / 2;
  const R_e = geometry.exitDiameter / 2;
  const epsilon = (R_e * R_e) / (R_t * R_t);
  
  // Create analyzer
  const nozzle = new NozzleOptimizationAnalyzer({
    gamma: gamma,
    R: R,
    T_c: T_c,
    P_c: P_c,
    P_amb: P_amb,
    epsilon: epsilon,
    R_t: R_t,
  });
  
  const results = nozzle.getResults();
  
  // Format contour data for plot
  const contourData = results.contour.map(point => ({
    x: (point.x * 100).toFixed(1),
    r_upper: (point.r * 100).toFixed(2),
    r_lower: (-point.r * 100).toFixed(2),
  }));
  
  // Format length trade-off data
  const lengthData = results.lengthTradeoff.map(item => ({
    length: item.L_percent.toFixed(0),
    efficiency: (item.efficiency * 100).toFixed(2),
    exit_angle: item.alpha_exit.toFixed(1),
  }));
  
  // Performance bars
  const performanceData = [
    { metric: 'Thrust Coeff (C_F)', value: (results.C_F * 100).toFixed(1), target: 180, fill: '#00d9ff' },
    { metric: 'Nozzle Efficiency', value: (results.eta_nozzle * 100).toFixed(1), target: 100, fill: '#00ff00' },
    { metric: 'Divergence Eff', value: (results.eta_divergence * 100).toFixed(1), target: 100, fill: '#ffd700' },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00ff00', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🚀 Nozzle Shape Optimization
      </h2>

      <div className="content-grid">
        {/* THRUST COEFFICIENT */}
        <div className="panel">
          <h2>📊 Thrust Coefficient</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>C_F</div>
              <div style={{ fontSize: '2rem', color: '#00d9ff', fontWeight: 'bold' }}>
                {results.C_F.toFixed(3)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>C_F Ideal</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.C_F_ideal.toFixed(3)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Efficiency</div>
              <div style={{ fontSize: '1.2rem', color: '#00ff00' }}>
                {((results.C_F / results.C_F_ideal) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* SPECIFIC IMPULSE */}
        <div className="panel">
          <h2>⚡ Specific Impulse</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>I_sp</div>
              <div style={{ fontSize: '2rem', color: '#00ff00', fontWeight: 'bold' }}>
                {results.I_sp.toFixed(1)} s
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>c* (Characteristic Velocity)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.c_star.toFixed(0)} m/s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Exit Pressure</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {(results.P_e / 1e5).toFixed(2)} bar
              </div>
            </div>
          </div>
        </div>

        {/* NOZZLE EFFICIENCY */}
        <div className="panel">
          <h2>✨ Nozzle Efficiency</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Overall (η_nozzle)</div>
              <div style={{ fontSize: '2rem', color: results.eta_nozzle > 0.95 ? '#00ff00' : '#ffd700', fontWeight: 'bold' }}>
                {(results.eta_nozzle * 100).toFixed(2)}%
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Divergence Loss</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.divergence_loss.toFixed(2)}%
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Exit Angle (α_e)</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {results.alpha_exit.toFixed(1)}°
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        {/* EXPANSION RATIO */}
        <div className="panel">
          <h2>📐 Expansion Ratio</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Actual (ε)</div>
              <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                {results.epsilon.toFixed(1)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Optimal (ε_opt)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.epsilon_optimal.toFixed(1)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Error</div>
              <div style={{ fontSize: '1.2rem', color: Math.abs(results.expansion_ratio_error) < 10 ? '#00ff00' : '#ff6b35' }}>
                {results.expansion_ratio_error > 0 ? '+' : ''}{results.expansion_ratio_error.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* GEOMETRY */}
        <div className="panel">
          <h2>📏 Nozzle Geometry</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Length</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {(results.L_nozzle * 100).toFixed(1)} cm
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Exit Radius</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.R_e * 100).toFixed(1)} cm
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Type</div>
              <div style={{ fontSize: '1.0rem', color: '#00ff00', textTransform: 'uppercase' }}>
                Bell (80%)
              </div>
            </div>
          </div>
        </div>

        {/* PERFORMANCE STATUS */}
        <div className="panel">
          <h2>✅ Optimization Status</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Design Quality</div>
              <div style={{ 
                fontSize: '1.5rem', 
                color: results.eta_nozzle > 0.95 ? '#00ff00' : '#ffd700',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {results.eta_nozzle > 0.95 ? 'Excellent' : 'Good'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Contour</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                Optimized Bell
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Method</div>
              <div style={{ fontSize: '1.0rem', color: '#ffd700' }}>
                Rao MOC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NOZZLE CONTOUR */}
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
          🔷 Optimized Bell Nozzle Contour
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Method of Characteristics (MOC) - 80% length bell nozzle
        </p>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={contourData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="x" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Radius (cm)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="r_upper" 
              stroke="#00d9ff" 
              strokeWidth={3}
              dot={false}
              name="Upper Wall"
            />
            <Line 
              type="monotone" 
              dataKey="r_lower" 
              stroke="#00d9ff" 
              strokeWidth={3}
              dot={false}
              name="Lower Wall"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#888'
        }}>
          <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
            Bell Nozzle Features:
          </div>
          <div>• Smooth transition from throat to exit</div>
          <div>• Reduced divergence losses compared to conical nozzle</div>
          <div>• 80% of equivalent conical length → compact design</div>
          <div>• Exit angle: {results.alpha_exit.toFixed(1)}° → minimized divergence loss</div>
        </div>
      </div>

      {/* LENGTH OPTIMIZATION */}
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
          📈 Length vs Efficiency Trade-off
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Shorter nozzle → higher exit angle → more divergence loss
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={lengthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="length" 
              stroke="#888"
              label={{ value: 'Nozzle Length (% of Full Cone)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              yAxisId="eff"
              stroke="#888"
              domain={[95, 100]}
              label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="angle"
              orientation="right"
              stroke="#888"
              label={{ value: 'Exit Angle (°)', angle: 90, position: 'insideRight', fill: '#888' }}
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
              yAxisId="eff"
              type="monotone" 
              dataKey="efficiency" 
              stroke="#00ff00" 
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Efficiency (%)"
            />
            <Line 
              yAxisId="angle"
              type="monotone" 
              dataKey="exit_angle" 
              stroke="#ff6b35" 
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Exit Angle (°)"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#888'
        }}>
          <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
            Design Choice: 80% Length
          </div>
          <div>• Efficiency: {lengthData[2].efficiency}% (only {(100 - parseFloat(lengthData[2].efficiency)).toFixed(2)}% loss)</div>
          <div>• Exit angle: {lengthData[2].exit_angle}° (excellent)</div>
          <div>• 20% mass savings vs full-length cone</div>
          <div>• Industry standard for rocket nozzles</div>
        </div>
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
          color: '#00ff00', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          📊 Performance Summary
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="metric" 
              stroke="#888"
            />
            <YAxis 
              stroke="#888"
              domain={[0, 200]}
              label={{ value: 'Value', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Bar dataKey="value" name="Actual">
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
          📐 Nozzle Optimization Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Thrust Coefficient:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              C_F = sqrt(2γ²/(γ-1) · (2/(γ+1))^((γ+1)/(γ-1)) · [1-(P_e/P_c)^((γ-1)/γ)])
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Specific Impulse:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              I_sp = C_F · c* / g_0
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Divergence Efficiency:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              η_div = (1 + cos(α_e)) / 2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
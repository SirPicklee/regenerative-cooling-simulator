import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart } from 'recharts';
import { NozzlePerformanceAnalyzer } from '../physics/nozzlePerformance';

/**
 * NOZZLE PERFORMANCE ANALYSIS PANEL
 * Thrust, Isp, efficiency metrics
 */
export default function NozzlePerformancePanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Get exit conditions
  const exitIndex = fullThermalResults.axialPositions.length - 1;
  const x_exit = fullThermalResults.axialPositions[exitIndex];
  const M_exit = geometry.getMachNumber(x_exit);
  const T_exit = fullThermalResults.gasTemp[exitIndex];
  const P_chamber = simParams.chamberPressure * 1e5; // Pa
  const T_chamber = simParams.chamberTemp;
  
  // Calculate exit conditions
  const gamma = 1.25;
  const R_specific = 8314.46 / 25; // J/(kg·K)
  const a_exit = Math.sqrt(gamma * R_specific * T_exit);
  const V_exit = M_exit * a_exit;
  
  // Exit pressure (isentropic expansion)
  const P_ratio_exit = Math.pow(1 + ((gamma - 1) / 2) * M_exit * M_exit, -gamma / (gamma - 1));
  const P_exit = P_chamber * P_ratio_exit;
  
  // Geometry
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const A_throat = geometry.getArea(throatX);
  const A_exit = geometry.getArea(x_exit);
  
  // Create performance analyzer
  const analyzer = new NozzlePerformanceAnalyzer({
    massFlowRate: simParams.massFlowRate,
    P_chamber: P_chamber,
    T_chamber: T_chamber,
    P_exit: P_exit,
    V_exit: V_exit,
    A_throat: A_throat,
    A_exit: A_exit,
    P_ambient: 101325, // Sea level
    gamma: gamma,
    R: R_specific,
  });
  
  const performance = analyzer.getResults();
  
  // Calculate altitude performance (0 to 50 km)
  const altitudes = [0, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
  const altitudePerf = analyzer.calculateAltitudePerformance(altitudes);
  
  const altitudeData = altitudePerf.map(ap => ({
    altitude: (ap.altitude / 1000).toFixed(1), // km
    thrust: (ap.thrust / 1000).toFixed(1), // kN
    Isp: ap.Isp.toFixed(1), // s
    P_ambient: (ap.P_ambient / 1000).toFixed(2), // kPa
  }));
  
  // Thrust breakdown
  const thrustBreakdown = [
    { 
      name: 'Momentum', 
      value: performance.F_momentum / 1000, 
      percent: (performance.F_momentum / performance.F_total) * 100 
    },
    { 
      name: 'Pressure', 
      value: performance.F_pressure / 1000, 
      percent: (performance.F_pressure / performance.F_total) * 100 
    },
  ];
  
  // Expansion status color
  const getExpansionColor = (status) => {
    switch(status) {
      case 'optimal': return '#00ff00';
      case 'underexpanded': return '#ffd700';
      case 'overexpanded': return '#ff6b35';
      default: return '#888';
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ffd700', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🎯 Nozzle Performance Analysis
      </h2>

      <div className="content-grid">
        {/* THRUST */}
        <div className="panel">
          <h2>🚀 Thrust</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Thrust (Sea Level)</div>
              <div style={{ fontSize: '2.5rem', color: '#ffd700', fontWeight: 'bold' }}>
                {(performance.F_total / 1000).toFixed(1)} kN
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {(performance.F_total / 1000 / 9.81).toFixed(1)} metric tons
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Momentum Component</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(performance.F_momentum / 1000).toFixed(1)} kN
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {thrustBreakdown[0].percent.toFixed(1)}%
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Pressure Component</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {(performance.F_pressure / 1000).toFixed(1)} kN
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {thrustBreakdown[1].percent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* SPECIFIC IMPULSE */}
        <div className="panel">
          <h2>⚡ Specific Impulse</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>I_sp (Sea Level)</div>
              <div style={{ fontSize: '2.5rem', color: '#00ff00', fontWeight: 'bold' }}>
                {performance.Isp.toFixed(1)} s
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                F / (ṁ · g₀)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>I_sp (Vacuum)</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {performance.Isp_vac.toFixed(1)} s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Effective Exhaust Velocity</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {performance.c_eff.toFixed(0)} m/s
              </div>
            </div>
          </div>
        </div>

        {/* EFFICIENCY */}
        <div className="panel">
          <h2>📊 Efficiency</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>c* Efficiency</div>
              <div style={{ fontSize: '2rem', color: performance.eta_c_star > 0.95 ? '#00ff00' : '#ffd700', fontWeight: 'bold' }}>
                {(performance.eta_c_star * 100).toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Combustion efficiency
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>c* (Actual)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {performance.c_star.toFixed(0)} m/s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>c* (Theoretical)</div>
              <div style={{ fontSize: '1.2rem', color: '#666' }}>
                {performance.c_star_theoretical.toFixed(0)} m/s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANSION STATUS */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>📐 Expansion Ratio</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Actual (A_e / A_t)</div>
              <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                {performance.expansionRatio.toFixed(2)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Optimal (Sea Level)</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {performance.expansionRatio_optimal.toFixed(2)}
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: getExpansionColor(performance.expansionStatus) + '20',
              borderRadius: '4px',
              border: `1px solid ${getExpansionColor(performance.expansionStatus)}`,
              fontSize: '0.75rem'
            }}>
              Status: {performance.expansionStatus.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>💪 Thrust Coefficient</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>C_F</div>
              <div style={{ fontSize: '2.5rem', color: '#ff00ff', fontWeight: 'bold' }}>
                {performance.CF.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                F / (P_c · A_t)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Pressure Ratio</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {performance.pressureRatio.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                P_e / P_a
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thrust Density</div>
              <div style={{ fontSize: '1.2rem', color: '#00ff00' }}>
                {(performance.thrustDensity / 1e6).toFixed(2)} MPa
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📊 Performance Summary</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>Exit Velocity:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>{V_exit.toFixed(0)} m/s</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>Exit Mach:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>{M_exit.toFixed(2)}</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>Exit Pressure:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>{(P_exit / 1e3).toFixed(1)} kPa</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>Mass Flow:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>{simParams.massFlowRate} kg/s</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Chamber Pressure:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>{simParams.chamberPressure} bar</span>
            </div>
          </div>
        </div>
      </div>

      {/* THRUST BREAKDOWN */}
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
          🚀 Thrust Components Breakdown
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          F = ṁ·V_e + (P_e - P_a)·A_e
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={thrustBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="name" 
              stroke="#888"
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Thrust (kN)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Bar dataKey="value" name="Thrust (kN)" fill="#ffd700" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ALTITUDE PERFORMANCE */}
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
          🌍 Altitude Performance
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Thrust and I_sp variation with altitude
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={altitudeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="altitude" 
              stroke="#888"
              label={{ value: 'Altitude (km)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              yAxisId="thrust"
              stroke="#888"
              label={{ value: 'Thrust (kN)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="isp"
              orientation="right"
              stroke="#888"
              label={{ value: 'I_sp (s)', angle: 90, position: 'insideRight', fill: '#888' }}
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
              yAxisId="thrust"
              type="monotone" 
              dataKey="thrust" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="Thrust (kN)"
            />
            <Line 
              yAxisId="isp"
              type="monotone" 
              dataKey="Isp" 
              stroke="#00ff00" 
              strokeWidth={3}
              dot={false}
              name="I_sp (s)"
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
            Key Observations:
          </div>
          <div>• Thrust increases with altitude (lower ambient pressure)</div>
          <div>• I_sp increases with altitude (more efficient expansion)</div>
          <div>• Maximum performance achieved in vacuum</div>
        </div>
      </div>

      {/* FORMULAS */}
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
          📐 Performance Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Thrust:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              F = ṁ · V_e + (P_e - P_a) · A_e
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Specific Impulse:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              I_sp = F / (ṁ · g₀) = c / g₀
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff00ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Thrust Coefficient:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              C_F = F / (P_c · A_t)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
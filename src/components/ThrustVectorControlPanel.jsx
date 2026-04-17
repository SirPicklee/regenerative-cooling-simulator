import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ThrustVectorControlAnalyzer } from '../physics/thrustVectorControl';

/**
 * THRUST VECTOR CONTROL PANEL
 * Engine gimballing analysis
 */
export default function ThrustVectorControlPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Calculate thrust from mass flow rate (more reliable than geometry)
  const gamma = 1.2;
  const R = 8314.46 / 25; // CH4/O2 mix
  const T_chamber = simParams.chamberTemp;
  const m_dot = simParams.massFlowRate;
  
  // Exit velocity estimate (simplified)
  const c_star = Math.sqrt(gamma * R * T_chamber / (gamma - 1));
  const V_exit = c_star * 1.5; // Expansion factor ~1.5
  
  // Thrust: F = m_dot * V_exit
  const F_thrust = m_dot * V_exit;
  
  // Create TVC analyzer
  const tvc = new ThrustVectorControlAnalyzer({
    F_thrust: F_thrust,
    delta_max: 8,              // ±8° max gimbal
    L_moment_arm: 10,          // 10m from gimbal to CG
    L_attachment: 0.5,         // 0.5m actuator attachment point
    I_vehicle: 1e6,            // 1e6 kg·m² vehicle inertia
    I_gimbal: 5000,            // 5000 kg·m² engine inertia
    k_spring: 1e7,             // 10 MN/rad spring stiffness
    c_damper: 5e5,             // 500 kN·s/rad damping
    delta_dot_max: 0.5,        // 0.5 rad/s max gimbal rate
  });
  
  const results = tvc.getResults();
  
  // Format gimbal data for charts
  const gimbalChartData = results.gimbalData.map(item => ({
    angle: parseFloat(item.delta.toFixed(1)),
    F_side_kN: parseFloat((item.F_side / 1000).toFixed(0)),
    torque_kNm: parseFloat((item.tau / 1000).toFixed(0)),
    F_actuator_kN: parseFloat((item.F_actuator / 1000).toFixed(0)),
    stroke_mm: parseFloat((item.stroke * 1000).toFixed(1)),
    power_kW: parseFloat((item.power / 1000).toFixed(1)),
    F_bearing_kN: parseFloat((item.F_bearing / 1000).toFixed(0)),
  }));
  
  // Performance radar data
  const performanceData = [
    { metric: 'Control Authority', value: Math.min(100, results.alpha_max * 10), fullMark: 100 },
    { metric: 'Response Speed', value: Math.min(100, results.bandwidth * 20), fullMark: 100 },
    { metric: 'Max Deflection', value: (8 / 10) * 100, fullMark: 100 },
    { metric: 'Actuator Efficiency', value: 85, fullMark: 100 },
    { metric: 'Bearing Capacity', value: 90, fullMark: 100 },
  ];
  
  // Slosh coupling color
  const getSloshColor = (risk) => {
    return risk ? '#ff0000' : '#00ff00';
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00d9ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🎯 Thrust Vector Control (TVC)
      </h2>

      <div className="content-grid">
        {/* CONTROL TORQUE */}
        <div className="panel">
          <h2>🔄 Control Torque</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Torque (τ_max)</div>
              <div style={{ fontSize: '2rem', color: '#00d9ff', fontWeight: 'bold' }}>
                {(results.tau_max / 1e6).toFixed(1)} MN·m
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Gimbal Angle</div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                ±8.0°
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Side Force</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {(results.F_side_max / 1000).toFixed(0)} kN
              </div>
            </div>
          </div>
        </div>

        {/* CONTROL AUTHORITY */}
        <div className="panel">
          <h2>💪 Control Authority</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Angular Accel (α_max)</div>
              <div style={{ fontSize: '2rem', color: '#00ff00', fontWeight: 'bold' }}>
                {results.alpha_max.toFixed(2)} rad/s²
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Vehicle Inertia (I)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                1.0 ×10⁶ kg·m²
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Moment Arm</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                10.0 m
              </div>
            </div>
          </div>
        </div>

        {/* ACTUATOR REQUIREMENTS */}
        <div className="panel">
          <h2>⚙️ Actuator Requirements</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Force</div>
              <div style={{ fontSize: '2rem', color: '#ff6b35', fontWeight: 'bold' }}>
                {(results.F_actuator_max / 1000).toFixed(0)} kN
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Stroke</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.stroke_max * 1000).toFixed(1)} mm
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Power</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {(results.power_max / 1000).toFixed(1)} kW
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        {/* RESPONSE TIME */}
        <div className="panel">
          <h2>⚡ Response Characteristics</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Response Time</div>
              <div style={{ fontSize: '2rem', color: '#00d9ff', fontWeight: 'bold' }}>
                {(results.t_response * 1000).toFixed(0)} ms
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Natural Frequency</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.f_natural.toFixed(2)} Hz
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Bandwidth</div>
              <div style={{ fontSize: '1.2rem', color: '#00ff00' }}>
                {results.bandwidth.toFixed(2)} Hz
              </div>
            </div>
          </div>
        </div>

        {/* SLOSH COUPLING */}
        <div className="panel">
          <h2>🌊 Slosh Coupling</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Slosh Frequency</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {results.f_slosh.toFixed(2)} Hz
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>TVC Frequency</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.f_natural.toFixed(2)} Hz
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Coupling Risk</div>
              <div style={{ 
                fontSize: '1.2rem', 
                color: getSloshColor(results.slosh_coupling_risk),
                fontWeight: 'bold'
              }}>
                {results.slosh_coupling_risk ? 'HIGH' : 'LOW'}
              </div>
            </div>
          </div>
        </div>

        {/* BEARING LOADS */}
        <div className="panel">
          <h2>🔩 Gimbal Bearing Loads</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Bearing Load</div>
              <div style={{ fontSize: '2rem', color: '#ff00ff', fontWeight: 'bold' }}>
                {(results.F_bearing_max / 1e6).toFixed(2)} MN
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thrust Component</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(F_thrust / 1e6).toFixed(2)} MN
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Side Load Component</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {((results.F_bearing_max - F_thrust) / 1000).toFixed(0)} kN
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTUATOR REQUIREMENTS */}
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
          ⚙️ Actuator Force & Stroke Requirements
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Linear actuator sizing
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={gimbalChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="angle" 
              stroke="#888"
              label={{ value: 'Gimbal Angle (°)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              yAxisId="force"
              stroke="#888"
              label={{ value: 'Force (kN)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="stroke"
              orientation="right"
              stroke="#888"
              label={{ value: 'Stroke (mm)', angle: 90, position: 'insideRight', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ff6b35',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              yAxisId="force"
              type="monotone" 
              dataKey="F_actuator_kN" 
              stroke="#ff6b35" 
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Actuator Force (kN)"
            />
            <Line 
              yAxisId="stroke"
              type="monotone" 
              dataKey="stroke_mm" 
              stroke="#00d9ff" 
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Actuator Stroke (mm)"
            />
          </LineChart>
        </ResponsiveContainer>
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
          📊 TVC Performance Map
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
              name="TVC Performance" 
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
          📐 Thrust Vector Control Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Side Force:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              F_side = F_thrust · sin(δ)
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Control Torque:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              τ = F_side · L_moment_arm
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Control Authority:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              α_max = τ_max / I_vehicle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
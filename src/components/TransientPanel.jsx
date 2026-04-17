import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';
import { TransientAnalyzer, timeConstant, thermalDiffusivity } from '../physics/transient';
import { MaterialHelpers } from '../physics/materials';

/**
 * TRANSIENT ANALYSIS PANEL
 * Time-dependent startup and shutdown simulation
 */
export default function TransientPanel({ fullThermalResults, geometry, simParams }) {
  const [isRunning, setIsRunning] = useState(false);
  const [transientData, setTransientData] = useState(null);
  
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Run transient simulation
  const runTransientSimulation = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      // Create transient analyzer
      const analyzer = new TransientAnalyzer({
        t_rampup: 2.0,
        t_steady: 5.0,
        t_cooldown: 10.0,
        T_chamber_max: simParams.chamberTemp,
        P_chamber_max: simParams.chamberPressure * 1e5,
        massFlowRate_max: simParams.massFlowRate,
        tau_cooling: 5.0,
      });
      
      // Generate timeline
      const timeline = analyzer.generateTimeline(0.05);
      
      // Calculate wall temperatures and thermal stresses over time
      const wallProps = MaterialHelpers.getWallProperties(400);
      const alpha = thermalDiffusivity(wallProps.k, wallProps.rho, wallProps.cp);
      
      const L_characteristic = 0.002;
      const h_conv = 10000;
      const A = 1.0;
      const V = L_characteristic * A;
      const tau_thermal = timeConstant(wallProps.rho, V, wallProps.cp, h_conv, A);
      
      // Enhance timeline with wall temperature and stress
      const enhancedTimeline = timeline.map(point => {
        const T_wall_hot = 293 + (point.T_chamber - 293) * (1 - Math.exp(-point.time / tau_thermal));
        const deltaT = T_wall_hot - 293;
        
        // Calculate thermal stress with safety checks
        const E = wallProps.E || 128e9;
        const alpha_exp = 17e-6;
        const nu = 0.34;
        const sigma_thermal = -E * alpha_exp * deltaT / (1 - nu);
        const sigma_thermal_abs = Math.abs(sigma_thermal / 1e6);
        
        // Ensure all values are valid numbers
        const safeValue = (val) => (isNaN(val) || !isFinite(val)) ? 0 : val;
        
        return {
          time: parseFloat(point.time.toFixed(2)),
          thrust: parseFloat((point.thrust * 100).toFixed(1)),
          T_chamber: parseFloat(point.T_chamber.toFixed(1)),
          T_wall: parseFloat(T_wall_hot.toFixed(1)),
          P_chamber: parseFloat((point.P_chamber / 1e5).toFixed(1)),
          massFlow: parseFloat(point.massFlowRate.toFixed(2)),
          sigma_thermal_abs: safeValue(sigma_thermal_abs),
          coolingRate: point.coolingRate ? parseFloat(point.coolingRate.toFixed(2)) : 0,
        };
      });
      
      // DEBUG - console'a yazdır
      console.log('Transient Data:', enhancedTimeline.slice(0, 5));
      console.log('Sample sigma_thermal_abs:', enhancedTimeline.map(d => d.sigma_thermal_abs).slice(0, 10));
      
      setTransientData({
        timeline: enhancedTimeline,
        tau_thermal: tau_thermal,
        alpha: alpha,
      });
      
      setIsRunning(false);
    }, 500);
  };

  const wallProps = MaterialHelpers.getWallProperties(400);
  const alpha = thermalDiffusivity(wallProps.k, wallProps.rho, wallProps.cp);
  const L = 0.002;
  const h = 10000;
  const tau_calc = timeConstant(wallProps.rho, L * 1.0, wallProps.cp, h, 1.0);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00d9ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        ⏱️ Transient Analysis (Time-Dependent)
      </h2>

      {/* RUN SIMULATION BUTTON */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <button 
          onClick={runTransientSimulation}
          disabled={isRunning}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            fontFamily: 'Orbitron',
            background: isRunning ? '#333' : 'linear-gradient(135deg, #00d9ff, #0088ff)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s'
          }}
        >
          {isRunning ? '⏳ Simulating...' : '🚀 Run Startup/Shutdown Simulation'}
        </button>
        
        <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '1rem' }}>
          Simulates 2s startup → 5s steady-state → 10s cooldown
        </p>
      </div>

      {/* THERMAL PROPERTIES */}
      <div className="content-grid">
        <div className="panel">
          <h2>🔬 Thermal Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thermal Diffusivity (α)</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {(alpha * 1e6).toFixed(2)} mm²/s
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                α = k / (ρ·c_p)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thermal Time Constant (τ)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {tau_calc.toFixed(3)} s
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Time to reach 63% of final temp
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Heat Capacity (ρ·c_p)</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {((wallProps.rho * wallProps.cp) / 1e6).toFixed(2)} MJ/(m³·K)
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>⏱️ Sequence Timing</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Startup Duration</div>
              <div style={{ fontSize: '1.5rem', color: '#00ff00' }}>
                2.0 s
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Ignition → Full thrust
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Steady-State</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                5.0 s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Cooldown</div>
              <div style={{ fontSize: '1.2rem', color: '#0088ff' }}>
                10.0 s
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📊 Analysis Type</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Method</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                Lumped Capacitance
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Valid for Bi &lt; 0.1
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Time Steps</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                340 steps
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Δt = 50 ms
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Duration</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                17.0 s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSIENT RESULTS */}
      {transientData && (
        <>
          {/* THRUST PROFILE */}
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
              🚀 Thrust Profile (Startup Sequence)
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
              S-curve ramp-up from ignition to full thrust
            </p>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={transientData.timeline}>
                <defs>
                  <linearGradient id="thrustGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff00" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00ff00" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#888"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#888' }}
                />
                <YAxis 
                  stroke="#888"
                  label={{ value: 'Thrust (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
                  domain={[0, 100]}
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
                  type="monotone" 
                  dataKey="thrust" 
                  stroke="#00ff00" 
                  fill="url(#thrustGradient)"
                  strokeWidth={3}
                  name="Thrust (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* TEMPERATURE EVOLUTION */}
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
              🌡️ Temperature Evolution
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Chamber and wall temperature vs time
            </p>
            
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={transientData.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#888"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#888' }}
                />
                <YAxis 
                  stroke="#888"
                  label={{ value: 'Temperature (K)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
                  type="monotone" 
                  dataKey="T_chamber" 
                  stroke="#ff6b35" 
                  strokeWidth={3}
                  dot={false}
                  name="Chamber Temp (K)"
                />
                <Line 
                  type="monotone" 
                  dataKey="T_wall" 
                  stroke="#00d9ff" 
                  strokeWidth={3}
                  dot={false}
                  name="Wall Temp (K)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* PRESSURE AND MASS FLOW */}
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
              💪 Pressure & Mass Flow Evolution
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Chamber pressure and propellant flow rate vs time
            </p>
            
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={transientData.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#888"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#888' }}
                />
                <YAxis 
                  yAxisId="pressure"
                  stroke="#888"
                  label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft', fill: '#888' }}
                />
                <YAxis 
                  yAxisId="flow"
                  orientation="right"
                  stroke="#888"
                  label={{ value: 'Mass Flow (kg/s)', angle: 90, position: 'insideRight', fill: '#888' }}
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
                  yAxisId="pressure"
                  type="monotone" 
                  dataKey="P_chamber" 
                  stroke="#ffd700" 
                  strokeWidth={3}
                  dot={false}
                  name="Pressure (bar)"
                />
                <Line 
                  yAxisId="flow"
                  type="monotone" 
                  dataKey="massFlow" 
                  stroke="#00d9ff" 
                  strokeWidth={3}
                  dot={false}
                  name="Mass Flow (kg/s)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* THERMAL STRESS EVOLUTION */}
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
              🔩 Thermal Stress Evolution
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Transient thermal stress during startup and cooldown (absolute value)
            </p>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={transientData.timeline}>
                <defs>
                  <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff00ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff00ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#888"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#888' }}
                />
                <YAxis 
                  stroke="#888"
                  domain={[0, 'auto']}
                  label={{ value: 'Thermal Stress (MPa)', angle: -90, position: 'insideLeft', fill: '#888' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a1a1a', 
                    border: '1px solid #ff00ff',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="sigma_thermal_abs" 
                  stroke="#ff00ff" 
                  fill="url(#stressGradient)"
                  strokeWidth={3}
                  name="Thermal Stress (MPa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* KEY INSIGHTS */}
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
              💡 Key Insights
            </h3>
            
            <div style={{ fontSize: '0.85rem', color: '#fff' }}>
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  ✅ Startup Phase (0-2s):
                </div>
                <div style={{ color: '#888' }}>
                  • Smooth S-curve thrust ramp prevents pressure spikes<br/>
                  • Wall temperature lags chamber temp due to thermal inertia (τ = {transientData.tau_thermal.toFixed(3)}s)<br/>
                  • Thermal stress builds gradually, reducing shock loads
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  ⚡ Steady-State (2-7s):
                </div>
                <div style={{ color: '#888' }}>
                  • Full thrust operation at maximum parameters<br/>
                  • Wall reaches thermal equilibrium<br/>
                  • Constant thermal stress and heat flux
                </div>
              </div>
              
              <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ color: '#0088ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  ❄️ Cooldown Phase (7-17s):
                </div>
                <div style={{ color: '#888' }}>
                  • Exponential temperature decay: T(t) = T_∞ + (T_0 - T_∞)·e^(-t/τ)<br/>
                  • Thermal stress reverses (tensile → compressive)<br/>
                  • Cooling rate: ~{((transientData.timeline[transientData.timeline.length-1].T_wall - 293) / 10).toFixed(1)} K/s average
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* INFORMATION PANEL IF NOT RUN */}
      {!transientData && (
        <div style={{ 
          background: '#0a0a0a', 
          padding: '2rem', 
          borderRadius: '8px',
          border: '1px solid #333',
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
          <h3 style={{ color: '#00d9ff', marginBottom: '1rem', fontFamily: 'Orbitron' }}>
            Click "Run Startup/Shutdown Simulation" to analyze transient behavior
          </h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            This will simulate the complete engine cycle including:<br/>
            • Ignition and thrust ramp-up<br/>
            • Steady-state operation<br/>
            • Shutdown and thermal cooldown
          </p>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ComposedChart, Area } from 'recharts';
import { AcousticAnalyzer } from '../physics/acousticAnalysis';

/**
 * ACOUSTIC ANALYSIS PANEL
 * Combustion instability, acoustic modes, pressure oscillations
 */
export default function AcousticPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Create acoustic analyzer
  const acoustic = new AcousticAnalyzer({
    L_chamber: geometry.L_chamber,
    R_chamber: geometry.chamberDiameter / 2,
    T_chamber: simParams.chamberTemp,
    P_chamber: simParams.chamberPressure * 1e5, // Pa
    gamma: 1.25,
    R_gas: 8314.46 / 25,
    massFlowRate: simParams.massFlowRate,
  });
  
  const results = acoustic.getResults();
  
  // Mode colors by type
  const getModeColor = (type) => {
    switch(type) {
      case 'longitudinal': return '#ff6b35';
      case 'tangential': return '#00d9ff';
      case 'radial': return '#ffd700';
      default: return '#888';
    }
  };
  
  // Stability status color
  const getStabilityColor = (status) => {
    switch(status) {
      case 'stable': return '#00ff00';
      case 'marginally_stable': return '#ffd700';
      case 'unstable': return '#ff0000';
      default: return '#888';
    }
  };
  
  // Mode data for chart
  const modeData = results.allModes.slice(0, 10).map((mode, idx) => ({
    name: mode.mode,
    frequency: mode.frequency,
    type: mode.type,
    fill: getModeColor(mode.type),
  }));

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00d9ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🎵 Acoustic Analysis & Combustion Instability
      </h2>

      <div className="content-grid">
        {/* SPEED OF SOUND */}
        <div className="panel">
          <h2>🔊 Speed of Sound</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>In Chamber</div>
              <div style={{ fontSize: '2rem', color: '#00d9ff', fontWeight: 'bold' }}>
                {results.a.toFixed(0)} m/s
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                a = √(γ·R·T)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Chamber Temperature</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {simParams.chamberTemp} K
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Chamber Length</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {(geometry.L_chamber * 100).toFixed(1)} cm
              </div>
            </div>
          </div>
        </div>

        {/* FUNDAMENTAL FREQUENCY */}
        <div className="panel">
          <h2>🎼 Fundamental Mode</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>1st Longitudinal (1L)</div>
              <div style={{ fontSize: '2rem', color: '#ff6b35', fontWeight: 'bold' }}>
                {results.f_fundamental.toFixed(0)} Hz
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Quarter-wave resonance
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Wavelength</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.longitudinal[0].wavelength.toFixed(3)} m
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Period</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(1000 / results.f_fundamental).toFixed(2)} ms
              </div>
            </div>
          </div>
        </div>

        {/* STABILITY STATUS */}
        <div className="panel">
          <h2>⚠️ Stability Status</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Status</div>
              <div style={{ 
                fontSize: '1.5rem', 
                color: getStabilityColor(results.stabilityStatus),
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {results.stabilityStatus.replace('_', ' ')}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Stability Margin</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.stabilityMargin.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {results.stabilityMargin > 1.5 ? 'Safe' : results.stabilityMargin > 1.0 ? 'Marginal' : 'Unstable'}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Growth Rate</div>
              <div style={{ fontSize: '1.2rem', color: results.growthRate < 0 ? '#00ff00' : '#ff0000' }}>
                {results.growthRate.toFixed(4)} s⁻¹
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RAYLEIGH ANALYSIS */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>📉 Rayleigh Criterion</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Rayleigh Index</div>
              <div style={{ fontSize: '1.5rem', color: results.rayleigh < 0 ? '#00ff00' : '#ff0000', fontWeight: 'bold' }}>
                {results.rayleigh.toFixed(4)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {results.rayleigh < 0 ? 'Pressure & heat release OUT OF PHASE' : 'IN PHASE'}
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: results.rayleigh < 0 ? '#00ff0020' : '#ff000020',
              borderRadius: '4px',
              border: `1px solid ${results.rayleigh < 0 ? '#00ff00' : '#ff0000'}`,
              fontSize: '0.75rem'
            }}>
              {results.rayleigh < 0 ? '✅ STABLE: Energy extracted from oscillations' : '⚠️ UNSTABLE: Energy fed into oscillations'}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🔇 Damping</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Damping Coefficient (α)</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {results.damping.toFixed(6)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Damping Source</div>
              <div style={{ fontSize: '1.0rem', color: '#fff' }}>
                Viscous losses
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Decay Time</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(1 / results.damping).toFixed(3)} s
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📊 Mode Count</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Longitudinal</div>
              <div style={{ fontSize: '1.5rem', color: '#ff6b35' }}>
                {results.longitudinal.length}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Tangential</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {results.tangential.length}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Radial</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {results.radial.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACOUSTIC MODES CHART */}
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
          🎼 Acoustic Mode Frequencies
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Natural resonance frequencies of the combustion chamber
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={modeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="name" 
              stroke="#888"
              label={{ value: 'Mode', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Bar dataKey="frequency" name="Frequency (Hz)">
              {modeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          display: 'flex',
          gap: '1rem',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '12px', background: '#ff6b35', borderRadius: '2px' }}></div>
            <span style={{ color: '#888' }}>Longitudinal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '12px', background: '#00d9ff', borderRadius: '2px' }}></div>
            <span style={{ color: '#888' }}>Tangential</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '12px', background: '#ffd700', borderRadius: '2px' }}></div>
            <span style={{ color: '#888' }}>Radial</span>
          </div>
        </div>
      </div>

      {/* PRESSURE OSCILLATION */}
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
          📊 Pressure Oscillation (Fundamental Mode)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Time-domain pressure variation at f = {results.f_fundamental.toFixed(0)} Hz
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={results.timeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="time" 
              stroke="#888"
              label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Pressure (bar)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="pressure" 
              stroke="#ff6b35" 
              strokeWidth={3}
              dot={false}
              name="Chamber Pressure (bar)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MODE TABLE */}
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
          📋 Acoustic Mode Details
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {/* Longitudinal */}
          <div>
            <h4 style={{ color: '#ff6b35', marginBottom: '0.5rem', fontSize: '1rem' }}>Longitudinal Modes</h4>
            {results.longitudinal.slice(0, 5).map((mode, idx) => (
              <div key={idx} style={{ 
                padding: '0.5rem',
                background: '#1a1a1a',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                fontSize: '0.75rem'
              }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{mode.mode}</div>
                <div style={{ color: '#888' }}>{mode.frequency.toFixed(0)} Hz</div>
              </div>
            ))}
          </div>
          
          {/* Tangential */}
          <div>
            <h4 style={{ color: '#00d9ff', marginBottom: '0.5rem', fontSize: '1rem' }}>Tangential Modes</h4>
            {results.tangential.map((mode, idx) => (
              <div key={idx} style={{ 
                padding: '0.5rem',
                background: '#1a1a1a',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                fontSize: '0.75rem'
              }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{mode.mode}</div>
                <div style={{ color: '#888' }}>{mode.frequency.toFixed(0)} Hz</div>
              </div>
            ))}
          </div>
          
          {/* Radial */}
          <div>
            <h4 style={{ color: '#ffd700', marginBottom: '0.5rem', fontSize: '1rem' }}>Radial Modes</h4>
            {results.radial.map((mode, idx) => (
              <div key={idx} style={{ 
                padding: '0.5rem',
                background: '#1a1a1a',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                fontSize: '0.75rem'
              }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>{mode.mode}</div>
                <div style={{ color: '#888' }}>{mode.frequency.toFixed(0)} Hz</div>
              </div>
            ))}
          </div>
        </div>
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
          color: '#00ff00', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          📐 Acoustic Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Longitudinal Modes (Quarter-wave):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              f_n = (2n - 1) · a / (4 · L)
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Rayleigh Criterion:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              ∫(p' · q') dt &gt; 0 → UNSTABLE
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Stability Margin:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              SM = α_damping / |Rayleigh| &gt; 1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
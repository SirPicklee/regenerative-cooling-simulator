import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { StructuralVibrationAnalyzer } from '../physics/structuralVibration';

/**
 * STRUCTURAL VIBRATION & MODAL ANALYSIS PANEL
 * Natural frequencies, resonance, mode shapes
 */
export default function StructuralVibrationPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Engine structural properties
  const L_engine = geometry.L_chamber + geometry.L_convergent + geometry.L_nozzle;
  const D_outer = 0.5;  // 0.5m outer diameter
  const t_wall = 0.005; // 5mm wall thickness
  
  // Material properties (steel)
  const rho_steel = 7850;  // kg/m³
  const E_steel = 200e9;   // Pa
  
  // Turbopump RPM (typical for rocket engines)
  const pumpRPM = 30000; // 30,000 RPM
  
  // Create analyzer
  const vibration = new StructuralVibrationAnalyzer({
    L: L_engine,
    D_outer: D_outer,
    t_wall: t_wall,
    rho_material: rho_steel,
    E: E_steel,
    material: 'steel',
    pumpRPM: pumpRPM,
  });
  
  const results = vibration.getResults();
  
  // Format mode data for bar chart
  const modeData = results.modes.map(mode => ({
    mode: `Mode ${mode.mode}`,
    frequency: mode.frequency.toFixed(1),
  }));
  
  // Format excitation sources
  const excitationData = Object.entries(results.excitations).map(([source, freq]) => ({
    source: source.charAt(0).toUpperCase() + source.slice(1),
    frequency: freq.toFixed(1),
  }));
  
  // Resonance risk colors
  const getRiskColor = (risk) => {
    const colors = {
      'high': '#ff0000',
      'moderate': '#ffd700',
      'low': '#00ff00',
    };
    return colors[risk] || '#888';
  };
  
  // Mode shape data (first mode)
  const modeShapeData = results.modeShapes[0].shape.map(point => ({
    position: point.x_percent.toFixed(0),
    amplitude: point.amplitude.toFixed(3),
  }));
  
  // Transmissibility data
  const transData = results.transmissibility.map(item => ({
    source: item.source.charAt(0).toUpperCase() + item.source.slice(1),
    T: item.T.toFixed(2),
  }));

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff00ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🌊 Structural Vibration & Modal Analysis
      </h2>

      <div className="content-grid">
        {/* FUNDAMENTAL FREQUENCY */}
        <div className="panel">
          <h2>🎵 Fundamental Frequency</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Mode 1 (f₁)</div>
              <div style={{ fontSize: '2rem', color: '#ff00ff', fontWeight: 'bold' }}>
                {results.modes[0].frequency.toFixed(1)} Hz
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Period (T₁)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.modes[0].period * 1000).toFixed(1)} ms
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Engine Length</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {L_engine.toFixed(2)} m
              </div>
            </div>
          </div>
        </div>

        {/* DAMPING */}
        <div className="panel">
          <h2>🔇 Damping Ratio</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>ζ (zeta)</div>
              <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                {(results.zeta * 100).toFixed(2)}%
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Material</div>
              <div style={{ fontSize: '1.2rem', color: '#fff', textTransform: 'uppercase' }}>
                Steel
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Quality Factor (Q)</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {results.Q.toFixed(1)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                Amplification at resonance
              </div>
            </div>
          </div>
        </div>

        {/* CRITICAL RESONANCE */}
        <div className="panel">
          <h2>⚠️ Critical Resonance</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Risk Level</div>
              <div style={{ 
                fontSize: '1.5rem', 
                color: getRiskColor(results.criticalResonance.risk),
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {results.criticalResonance.risk}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Source</div>
              <div style={{ fontSize: '1.2rem', color: '#fff', textTransform: 'capitalize' }}>
                {results.criticalResonance.source}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Safety Margin</div>
              <div style={{ fontSize: '1.2rem', color: getRiskColor(results.criticalResonance.risk) }}>
                {results.criticalResonance.margin.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        {/* STRUCTURAL PROPERTIES */}
        <div className="panel">
          <h2>🏗️ Structural Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Mass</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {results.mass_total.toFixed(1)} kg
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Moment of Inertia (I)</div>
              <div style={{ fontSize: '1.0rem', color: '#fff' }}>
                {(results.I * 1e6).toExponential(2)} ×10⁻⁶ m⁴
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Young's Modulus (E)</div>
              <div style={{ fontSize: '1.0rem', color: '#ffd700' }}>
                200 GPa
              </div>
            </div>
          </div>
        </div>

        {/* EXCITATION SOURCES */}
        <div className="panel">
          <h2>📡 Excitation Sources</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Turbopump</div>
              <div style={{ fontSize: '1.5rem', color: '#00ff00' }}>
                {results.excitations.pump.toFixed(0)} Hz
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {pumpRPM.toLocaleString()} RPM
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Combustion</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {results.excitations.combustion.toFixed(0)} Hz
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Flow (Vortex)</div>
              <div style={{ fontSize: '1.2rem', color: '#0088ff' }}>
                {results.excitations.flow.toFixed(0)} Hz
              </div>
            </div>
          </div>
        </div>

        {/* MODE 2 & 3 */}
        <div className="panel">
          <h2>🎼 Higher Modes</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Mode 2</div>
              <div style={{ fontSize: '1.5rem', color: '#ff00ff' }}>
                {results.modes[1].frequency.toFixed(1)} Hz
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Mode 3</div>
              <div style={{ fontSize: '1.2rem', color: '#ff00ff' }}>
                {results.modes[2].frequency.toFixed(1)} Hz
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                Higher modes less critical
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NATURAL FREQUENCIES */}
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
          🎵 Natural Frequencies (First 3 Modes)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Cantilever beam model (fixed at gimbal, free at nozzle)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={modeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="mode" 
              stroke="#888"
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Bar dataKey="frequency" name="Frequency (Hz)" fill="#ff00ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MODE SHAPE */}
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
          📈 Mode Shape (Fundamental Mode)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Relative displacement along engine length
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={modeShapeData}>
            <defs>
              <linearGradient id="modeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00d9ff" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Position Along Engine (%)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Amplitude (Normalized)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Area 
              type="monotone" 
              dataKey="amplitude" 
              stroke="#00d9ff" 
              fill="url(#modeGradient)"
              strokeWidth={3}
              name="Displacement"
            />
          </AreaChart>
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
            Mode Shape Interpretation:
          </div>
          <div>• 0% (gimbal point): Fixed - no displacement</div>
          <div>• 100% (nozzle exit): Free end - maximum displacement</div>
          <div>• Fundamental mode has no nodes (zero-crossings)</div>
        </div>
      </div>

      {/* RESONANCE CHECK TABLE */}
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
          ⚠️ Resonance Risk Assessment
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Checking all excitation sources vs natural frequencies
        </p>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            fontFamily: 'monospace'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>Source</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: '#888' }}>Mode</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', color: '#888' }}>f_excite (Hz)</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', color: '#888' }}>f_natural (Hz)</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: '#888' }}>Risk</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', color: '#888' }}>Margin (%)</th>
              </tr>
            </thead>
            <tbody>
              {results.resonanceChecks.map((check, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '0.5rem', color: '#fff', textTransform: 'capitalize' }}>{check.source}</td>
                  <td style={{ padding: '0.5rem', color: '#fff' }}>Mode {check.mode}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#00d9ff' }}>{check.f_excite.toFixed(1)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#ff00ff' }}>{check.f_natural.toFixed(1)}</td>
                  <td style={{ 
                    padding: '0.5rem', 
                    textAlign: 'center',
                    color: getRiskColor(check.risk),
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {check.risk}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: getRiskColor(check.risk) }}>
                    {check.margin.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          📐 Structural Vibration Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff00ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Natural Frequency (Cantilever Beam):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              f_n = (λ_n² / 2π) · sqrt(EI / (m·L⁴))
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Amplification Factor:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              Q = 1 / (2·ζ)
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Transmissibility:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              T = sqrt(1 + (2ζr)²) / sqrt((1-r²)² + (2ζr)²)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
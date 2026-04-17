import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { ConjugateHeatTransferAnalyzer } from '../physics/conjugateHeatTransfer';

/**
 * CONJUGATE HEAT TRANSFER PANEL
 * Coupled solid-fluid heat transfer analysis
 */
export default function ConjugateHeatTransferPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze at throat (highest heat flux location)
  const throatIndex = Math.floor(fullThermalResults.gasTemp.length / 2);
  const T_gas = fullThermalResults.gasTemp[throatIndex];
  const T_coolant = simParams.coolantInletTemp + 30; // Heated coolant
  
  // Heat transfer coefficients (simplified estimates)
  const h_gas = 2000;       // W/(m²·K) - gas side
  const h_coolant = 15000;  // W/(m²·K) - coolant side (much higher)
  
  // Wall parameters
  const thickness = 0.003;  // 3mm
  const material = 'copper'; // Copper alloy
  const sigma_max = 300e6;   // 300 MPa allowable stress
  
  // Create analyzer
  const cht = new ConjugateHeatTransferAnalyzer({
    T_gas: T_gas,
    T_coolant: T_coolant,
    h_gas: h_gas,
    h_coolant: h_coolant,
    thickness: thickness,
    material: material,
    sigma_max: sigma_max,
  });
  
  const results = cht.getResults();
  
  // Resistance distribution for pie chart
  const resistanceData = [
    { name: 'Gas Convection', value: results.frac_gas * 100, fill: '#ff6b35' },
    { name: 'Wall Conduction', value: results.frac_wall * 100, fill: '#ffd700' },
    { name: 'Coolant Convection', value: results.frac_coolant * 100, fill: '#0088ff' },
  ];
  
  // Wall temperature profile (3 points: hot side, middle, cold side)
  const wallProfileData = [
    { location: 'Hot Side (Gas)', T: results.T_hot.toFixed(0), position: 0 },
    { location: 'Mid-Wall', T: results.T_avg.toFixed(0), position: thickness * 1000 / 2 },
    { location: 'Cold Side (Coolant)', T: results.T_cold.toFixed(0), position: thickness * 1000 },
  ];
  
  // Thickness optimization sweep
  const thicknessData = results.thickness_sweep.map(item => ({
    t_mm: (item.t * 1000).toFixed(2),
    T_hot: item.T_hot.toFixed(0),
    T_cold: item.T_cold.toFixed(0),
    sigma_MPa: (item.sigma / 1e6).toFixed(0),
    Bi: item.Bi.toFixed(2),
  }));
  
  // Safety factor color
  const getSafetyColor = (sf) => {
    if (sf > 3) return '#00ff00';
    if (sf > 1.5) return '#ffd700';
    return '#ff0000';
  };
  
  // Biot number interpretation
  const getBiotInterpretation = (Bi) => {
    if (Bi < 0.1) return 'Lumped (Uniform T)';
    if (Bi < 10) return 'Moderate Gradient';
    return 'Severe Gradient';
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ffd700', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🔥 Conjugate Heat Transfer (Solid-Fluid Coupling)
      </h2>

      <div className="content-grid">
        {/* WALL TEMPERATURES */}
        <div className="panel">
          <h2>🌡️ Wall Temperatures</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Hot Side (Gas)</div>
              <div style={{ fontSize: '2rem', color: '#ff6b35', fontWeight: 'bold' }}>
                {results.T_hot.toFixed(0)} K
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Cold Side (Coolant)</div>
              <div style={{ fontSize: '1.5rem', color: '#0088ff' }}>
                {results.T_cold.toFixed(0)} K
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>ΔT Across Wall</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {(results.T_hot - results.T_cold).toFixed(0)} K
              </div>
            </div>
          </div>
        </div>

        {/* HEAT FLUX */}
        <div className="panel">
          <h2>⚡ Heat Flux</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Through Wall (q)</div>
              <div style={{ fontSize: '2rem', color: '#00ff00', fontWeight: 'bold' }}>
                {(results.q / 1e6).toFixed(2)} MW/m²
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Resistance</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.R_total * 1e4).toFixed(2)} ×10⁻⁴ K/(W/m²)
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Temp Gradient (dT/dx)</div>
              <div style={{ fontSize: '1.2rem', color: '#ff00ff' }}>
                {(results.dT_dx / 1e6).toFixed(1)} MK/m
              </div>
            </div>
          </div>
        </div>

        {/* THERMAL CONDUCTIVITY */}
        <div className="panel">
          <h2>🔬 Material Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Material</div>
              <div style={{ fontSize: '1.5rem', color: '#fff', textTransform: 'uppercase' }}>
                {material}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thermal Conductivity (k)</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {results.k_wall.toFixed(0)} W/(m·K)
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Wall Thickness</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(thickness * 1000).toFixed(1)} mm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        {/* BIOT NUMBER */}
        <div className="panel">
          <h2>📊 Biot Number</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Bi = h·L/k</div>
              <div style={{ fontSize: '2rem', color: results.Bi < 0.1 ? '#00ff00' : results.Bi < 10 ? '#ffd700' : '#ff6b35', fontWeight: 'bold' }}>
                {results.Bi.toFixed(3)}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Interpretation</div>
              <div style={{ fontSize: '1.0rem', color: '#fff' }}>
                {getBiotInterpretation(results.Bi)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem', fontSize: '0.7rem' }}>
                Bi &lt; 0.1: Uniform T in solid
              </div>
              <div style={{ color: '#666', fontSize: '0.7rem' }}>
                Bi &gt; 10: Large T gradient
              </div>
            </div>
          </div>
        </div>

        {/* THERMAL STRESS */}
        <div className="panel">
          <h2>💪 Thermal Stress</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>σ_thermal</div>
              <div style={{ fontSize: '2rem', color: '#ff6b35', fontWeight: 'bold' }}>
                {(results.sigma_thermal / 1e6).toFixed(0)} MPa
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Allowable Stress</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(sigma_max / 1e6).toFixed(0)} MPa
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Safety Factor</div>
              <div style={{ fontSize: '1.5rem', color: getSafetyColor(results.safety_factor) }}>
                {results.safety_factor.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* TIME CONSTANT */}
        <div className="panel">
          <h2>⏱️ Transient Response</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thermal Time Constant (τ)</div>
              <div style={{ fontSize: '2rem', color: '#00d9ff', fontWeight: 'bold' }}>
                {(results.tau * 1000).toFixed(2)} ms
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Time to Steady State</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.tau * 5 * 1000).toFixed(0)} ms
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                (≈ 5τ)
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                τ = ρ·c·L² / k
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THERMAL RESISTANCE DISTRIBUTION */}
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
          🔥 Thermal Resistance Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Which part of the heat path is the bottleneck?
        </p>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <ResponsiveContainer width="50%" height={300}>
            <PieChart>
              <Pie
                data={resistanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {resistanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#ff6b35', fontWeight: 'bold' }}>Gas Convection (R_gas)</div>
              <div style={{ color: '#fff', marginTop: '0.5rem' }}>
                {(results.R_gas * 1e4).toFixed(3)} ×10⁻⁴ K/(W/m²)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#ffd700', fontWeight: 'bold' }}>Wall Conduction (R_wall)</div>
              <div style={{ color: '#fff', marginTop: '0.5rem' }}>
                {(results.R_wall * 1e4).toFixed(3)} ×10⁻⁴ K/(W/m²)
              </div>
            </div>
            
            <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#0088ff', fontWeight: 'bold' }}>Coolant Convection (R_coolant)</div>
              <div style={{ color: '#fff', marginTop: '0.5rem' }}>
                {(results.R_coolant * 1e4).toFixed(3)} ×10⁻⁴ K/(W/m²)
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#888'
        }}>
          <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
            Dominant Resistance: {resistanceData[0].name}
          </div>
          <div>This controls the overall heat transfer. Improve this to increase cooling efficiency.</div>
        </div>
      </div>

      {/* WALL TEMPERATURE PROFILE */}
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
          🌡️ Wall Temperature Profile
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Temperature distribution across {(thickness * 1000).toFixed(1)}mm wall thickness
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={wallProfileData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Position (mm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Temperature (K)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="T" 
              stroke="#00d9ff" 
              strokeWidth={3}
              name="Temperature (K)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* THICKNESS OPTIMIZATION */}
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
          📏 Wall Thickness Optimization
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Trade-off: thicker wall → lower thermal stress but higher resistance
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={thicknessData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="t_mm" 
              stroke="#888"
              label={{ value: 'Wall Thickness (mm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              yAxisId="temp"
              stroke="#888"
              label={{ value: 'Temperature (K)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="stress"
              orientation="right"
              stroke="#888"
              label={{ value: 'Stress (MPa)', angle: 90, position: 'insideRight', fill: '#888' }}
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
            <Line 
              yAxisId="temp"
              type="monotone" 
              dataKey="T_hot" 
              stroke="#ff6b35" 
              strokeWidth={2}
              dot={false}
              name="Hot Side Temp (K)"
            />
            <Line 
              yAxisId="temp"
              type="monotone" 
              dataKey="T_cold" 
              stroke="#0088ff" 
              strokeWidth={2}
              dot={false}
              name="Cold Side Temp (K)"
            />
            <Line 
              yAxisId="stress"
              type="monotone" 
              dataKey="sigma_MPa" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="Thermal Stress (MPa)"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '4px',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 'bold', color: '#00ff00', marginBottom: '0.5rem' }}>
            Optimal Thickness: {(results.optimal_thickness.t * 1000).toFixed(2)} mm
          </div>
          <div style={{ color: '#888', fontSize: '0.75rem' }}>
            • Hot Side: {results.optimal_thickness.T_hot.toFixed(0)} K
          </div>
          <div style={{ color: '#888', fontSize: '0.75rem' }}>
            • Cold Side: {results.optimal_thickness.T_cold.toFixed(0)} K
          </div>
          <div style={{ color: '#888', fontSize: '0.75rem' }}>
            • Thermal Stress: {(results.optimal_thickness.sigma / 1e6).toFixed(0)} MPa
          </div>
          <div style={{ color: '#888', fontSize: '0.75rem' }}>
            • Biot Number: {results.optimal_thickness.Bi.toFixed(2)}
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
          color: '#ff00ff', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          📐 Conjugate Heat Transfer Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Thermal Resistance Network:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              R_total = R_gas + R_wall + R_coolant = 1/h_gas + t/k + 1/h_coolant
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Biot Number:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              Bi = h·L / k
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Thermal Stress:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              σ_thermal = E·α·ΔT / (1 - ν)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
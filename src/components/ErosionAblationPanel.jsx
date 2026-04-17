import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { ErosionAblationAnalyzer } from '../physics/erosionAblation';

/**
 * EROSION & ABLATION ANALYSIS PANEL
 * Material degradation and lifetime prediction
 */
export default function ErosionAblationPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze at throat (highest erosion)
  const throatIndex = Math.floor(fullThermalResults.gasTemp.length / 2);
  const T_gas = fullThermalResults.gasTemp[throatIndex];
  // With regenerative cooling, wall stays much cooler
  const T_wall = 400 + (T_gas - 400) * 0.08; // Only 8% of gas temp rise
  
  // Heat flux estimate
  const h_gas = 2000; // W/(m²·K)
  const T_coolant = simParams.coolantInletTemp + 30;
  const q_incident = h_gas * (T_gas - T_wall);
  
  // Particle properties (combustion products + impurities)
  const V_particle = 500;        // m/s (high velocity gas flow)
  const particleFlux = 0.01;     // kg/(m²·s) - small amount of particulates
  const theta_impact = 15;       // degrees (shallow angle, tangential flow)
  
  // Oxygen partial pressure
  const P_chamber = simParams.chamberPressure * 1e5;
  const P_ox = P_chamber * 0.3; // ~30% oxygen in combustion products
  
  // Typical rocket burn time
  const burnTime = 180; // 3 minutes
  
  // Create analyzer
  const erosion = new ErosionAblationAnalyzer({
    V_particle: V_particle,
    particleSize: 1e-6,           // 1 micron particles
    particleFlux: particleFlux,
    theta_impact: theta_impact,
    q_incident: q_incident,
    T_wall: T_wall,
    P_ox: P_ox,
    material: 'copper',
    burnTime: burnTime,
    thickness: 0.003,             // 3mm wall
  });
  
  const results = erosion.getResults();
  
  // Erosion contributions for pie chart
  const contributionData = [
    { name: 'Particle Erosion', value: results.contrib_particle, fill: '#ff6b35' },
    { name: 'Thermal Ablation', value: results.contrib_ablation, fill: '#ffd700' },
    { name: 'Oxidation', value: results.contrib_oxidation, fill: '#0088ff' },
  ].filter(item => item.value > 0.1); // Only show significant contributions
  
  // Erosion pattern along engine length
  const L_total = geometry.L_chamber + geometry.L_convergent + geometry.L_nozzle;
  const erosionPatternData = [];
  for (let i = 0; i < 50; i++) {
    const x = (i / 49) * L_total;
    const depth = results.depth_eroded * Math.exp(-Math.pow((i / 49) - 0.5, 2) / 0.05);
    erosionPatternData.push({
      position: (x * 100).toFixed(1),
      depth_um: (depth * 1e6).toFixed(2),
    });
  }
  
  // Lifetime vs thickness data
  const lifetimeData = [];
  for (let t = 1; t < 6; t += 0.5) {
    const cycles = (t * 0.001 * 0.5 / results.depth_eroded) * burnTime;
    lifetimeData.push({
      thickness_mm: t.toFixed(1),
      cycles: cycles.toFixed(0),
    });
  }
  
  // Regime color
  const getRegimeColor = (regime) => {
    const colors = {
      'negligible': '#00ff00',
      'low': '#00d9ff',
      'moderate': '#ffd700',
      'severe': '#ff0000',
    };
    return colors[regime] || '#888';
  };
  
  // Lifetime color
  const getLifetimeColor = (cycles) => {
    if (cycles > 100) return '#00ff00';
    if (cycles > 20) return '#ffd700';
    return '#ff6b35';
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff6b35', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🔥 Erosion & Ablation Analysis
      </h2>

      <div className="content-grid">
        {/* EROSION RATE */}
        <div className="panel">
          <h2>⚡ Total Erosion Rate</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>E_total</div>
              <div style={{ fontSize: '2rem', color: getRegimeColor(results.regime), fontWeight: 'bold' }}>
                {(results.E_total * 1e6).toExponential(2)} mg/(m²·s)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Regime</div>
              <div style={{ 
                fontSize: '1.2rem', 
                color: getRegimeColor(results.regime),
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                {results.regime}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Recession Velocity</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.v_ablation * 1e9).toFixed(2)} nm/s
              </div>
            </div>
          </div>
        </div>

        {/* EROSION DEPTH */}
        <div className="panel">
          <h2>📏 Erosion Depth</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>After {burnTime}s Burn</div>
              <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                {(results.depth_eroded * 1e6).toFixed(1)} μm
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Original Thickness</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                3.00 mm
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Remaining</div>
              <div style={{ fontSize: '1.2rem', color: results.thickness_remaining > 0.002 ? '#00ff00' : '#ff6b35' }}>
                {(results.thickness_remaining * 1000).toFixed(2)} mm
              </div>
            </div>
          </div>
        </div>

        {/* LIFETIME */}
        <div className="panel">
          <h2>⏱️ Lifetime Prediction</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Cycles to Failure</div>
              <div style={{ fontSize: '2rem', color: getLifetimeColor(results.cycles_to_failure), fontWeight: 'bold' }}>
                {results.cycles_to_failure > 1000 ? '1000+' : Math.floor(results.cycles_to_failure)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                (50% thickness loss)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Operating Time</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.lifetime / 3600).toFixed(1)} hours
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Status</div>
              <div style={{ fontSize: '1.0rem', color: results.cycles_to_failure > 50 ? '#00ff00' : '#ff6b35' }}>
                {results.cycles_to_failure > 50 ? 'LONG LIFE' : 'SHORT LIFE'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        {/* PARTICLE EROSION */}
        <div className="panel">
          <h2>💥 Particle Erosion</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Rate</div>
              <div style={{ fontSize: '1.5rem', color: '#ff6b35' }}>
                {(results.E_particle * 1e9).toExponential(2)} μg/(m²·s)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Particle Velocity</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {V_particle} m/s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Impact Angle</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {theta_impact}°
              </div>
            </div>
          </div>
        </div>

        {/* THERMAL ABLATION */}
        <div className="panel">
          <h2>🔥 Thermal Ablation</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Mass Loss Rate</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {(results.m_dot_ablation * 1e6).toExponential(2)} mg/(m²·s)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Heat Blocked</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.q_blocked / 1e6).toFixed(2)} MW/m²
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Wall Temperature</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {T_wall.toFixed(0)} K
              </div>
            </div>
          </div>
        </div>

        {/* OXIDATION */}
        <div className="panel">
          <h2>🧪 Oxidation</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Rate</div>
              <div style={{ fontSize: '1.5rem', color: '#0088ff' }}>
                {(results.E_oxidation * 1e9).toExponential(2)} μg/(m²·s)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>O₂ Partial Pressure</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(P_ox / 1e5).toFixed(1)} bar
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Material</div>
              <div style={{ fontSize: '1.0rem', color: '#ffd700', textTransform: 'uppercase' }}>
                Copper Alloy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EROSION CONTRIBUTIONS */}
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
          📊 Erosion Mechanism Contributions
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Which degradation mechanism dominates?
        </p>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <ResponsiveContainer width="50%" height={300}>
            <PieChart>
              <Pie
                data={contributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {contributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#ff6b35', fontWeight: 'bold' }}>Particle Erosion</div>
              <div style={{ color: '#fff', marginTop: '0.5rem' }}>
                {results.contrib_particle.toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Mechanical wear from particles
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#ffd700', fontWeight: 'bold' }}>Thermal Ablation</div>
              <div style={{ color: '#fff', marginTop: '0.5rem' }}>
                {results.contrib_ablation.toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Material melting/vaporization
              </div>
            </div>
            
            <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#0088ff', fontWeight: 'bold' }}>Oxidation</div>
              <div style={{ color: '#fff', marginTop: '0.5rem' }}>
                {results.contrib_oxidation.toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Chemical degradation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EROSION PATTERN */}
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
          📍 Erosion Pattern Along Engine
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Spatial distribution of material loss (peaks at throat)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={erosionPatternData}>
            <defs>
              <linearGradient id="erosionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
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
              label={{ value: 'Erosion Depth (μm)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Area 
              type="monotone" 
              dataKey="depth_um" 
              stroke="#ff6b35" 
              fill="url(#erosionGradient)"
              strokeWidth={3}
              name="Erosion Depth (μm)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* LIFETIME VS THICKNESS */}
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
          📈 Lifetime vs Wall Thickness
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Design trade-off: thicker wall → longer life but heavier
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lifetimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="thickness_mm" 
              stroke="#888"
              label={{ value: 'Wall Thickness (mm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Burn Cycles to Failure', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              type="monotone" 
              dataKey="cycles" 
              stroke="#00ff00" 
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Cycles to Failure"
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
            Design Considerations:
          </div>
          <div>• Current 3mm thickness → {Math.floor(results.cycles_to_failure)} burn cycles</div>
          <div>• Each cycle = {burnTime}s burn time</div>
          <div>• Thicker wall increases structural mass</div>
          <div>• Thinner wall reduces cooling efficiency</div>
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
          📐 Erosion & Ablation Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Particle Erosion (Finnie Model):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              E = K·V^n·f(θ)
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Thermal Ablation:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              ṁ_ablation = q_incident / (h_ablation + c·ΔT)
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#0088ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Lifetime Prediction:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              t_life = depth_critical / (E_total / ρ)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { StressAnalyzer, MATERIAL_PROPERTIES } from '../physics/stress';
import { CONSTANTS } from '../physics/constants';

/**
 * MATERIAL STRESS ANALYSIS PANEL
 * Thermal stress, pressure stress, Von Mises, safety factors
 */
export default function StressPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze stress at each axial position
  const stressAnalysis = [];
  const axialPositions = fullThermalResults.axialPositions;
  
  for (let i = 0; i < axialPositions.length; i++) {
    const x = axialPositions[i];
    const T_hot = fullThermalResults.wallTempHot[i];
    const T_cold = fullThermalResults.wallTempCold[i];
    
    // Get local geometry
    const r_inner = geometry.getRadius(x);
    
    // REALISTIC WALL THICKNESS - varies by engine and position
    const radius_mm = r_inner * 1000;
    const pressure_bar = simParams.chamberPressure;
    
    let t_wall_mm = 1.0;
    
    // Scale by chamber size
    if (radius_mm > 150) {
      t_wall_mm = 6.0; // RS-25 (large chamber)
    } else if (radius_mm > 130) {
      t_wall_mm = 5.0; // Raptor (medium)
    } else {
      t_wall_mm = 4.5; // Merlin (smaller but high pressure)
    }
    
    // Scale by pressure
    if (pressure_bar > 250) {
      t_wall_mm *= 1.3; // High pressure needs thicker walls
    }
    
    // Throat region needs extra thickness (high heat flux)
    const throatX = geometry.L_chamber + geometry.L_convergent;
    const distanceFromThroat = Math.abs(x - throatX);
    if (distanceFromThroat < 0.1) {
      t_wall_mm *= 1.5; // 50% thicker at throat
    }
    
    const t_wall = t_wall_mm / 1000; // Convert to meters
    const r_outer = r_inner + t_wall;
    
    // Pressure (convert bar to Pa)
    const P = simParams.chamberPressure * 1e5;
    
    // Effective cooling reduces thermal gradient
    const cooling_effectiveness = 0.7; // 70% effective
    const T_hot_effective = T_cold + (T_hot - T_cold) * cooling_effectiveness;
    
    // Create stress analyzer
    const analyzer = new StressAnalyzer({
      pressure: P,
      r_inner: r_inner,
      r_outer: r_outer,
      T_hot: T_hot_effective,
      T_cold: T_cold,
      T_ref: 293, // 20°C reference
      material: 'COPPER_C18150',
      Kt: 1.1, // Well-designed smooth transitions
    });
    
    const stressResults = analyzer.getResults();
    
    stressAnalysis.push({
      position: (x * 100).toFixed(1), // cm
      x: x,
      T_hot: T_hot,
      T_cold: T_cold,
      r_inner: r_inner * 1000, // mm
      t_wall: t_wall_mm,
      sigma_theta_pressure: stressResults.sigma_theta_pressure / 1e6, // MPa
      sigma_z_pressure: stressResults.sigma_z_pressure / 1e6,
      sigma_r_pressure: stressResults.sigma_r_pressure / 1e6,
      sigma_thermal: stressResults.sigma_thermal / 1e6,
      sigma_theta_total: stressResults.sigma_theta_total / 1e6,
      sigma_z_total: stressResults.sigma_z_total / 1e6,
      sigma_r_total: stressResults.sigma_r_total / 1e6,
      sigma_vm: stressResults.sigma_vm / 1e6,
      sigma_y: stressResults.sigma_y_operating / 1e6,
      SF: stressResults.SF,
      failureMode: stressResults.failureMode,
    });
  }
  
  // Find throat analysis
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = stressAnalysis.findIndex(item => Math.abs(item.x - throatX) < 0.01);
  const throatStress = stressAnalysis[throatIndex] || stressAnalysis[Math.floor(stressAnalysis.length / 2)];
  
  // Find maximum stress location
  const maxStressIndex = stressAnalysis.reduce((maxIdx, item, idx, arr) => 
    item.sigma_vm > arr[maxIdx].sigma_vm ? idx : maxIdx, 0);
  const maxStress = stressAnalysis[maxStressIndex];
  
  // Overall safety
  const minSF = Math.min(...stressAnalysis.map(s => s.SF));
  const avgSF = stressAnalysis.reduce((sum, s) => sum + s.SF, 0) / stressAnalysis.length;
  
  // Stress components for radar chart (at throat)
  const radarData = [
    { stress: 'Hoop (θ)', value: Math.abs(throatStress.sigma_theta_total), fullMark: throatStress.sigma_y },
    { stress: 'Axial (z)', value: Math.abs(throatStress.sigma_z_total), fullMark: throatStress.sigma_y },
    { stress: 'Radial (r)', value: Math.abs(throatStress.sigma_r_total), fullMark: throatStress.sigma_y },
    { stress: 'Von Mises', value: throatStress.sigma_vm, fullMark: throatStress.sigma_y },
    { stress: 'Thermal', value: Math.abs(throatStress.sigma_thermal), fullMark: throatStress.sigma_y },
  ];
  
  // Safety factor color
  const getSFColor = (SF) => {
    if (SF < 1.0) return '#ff0000';
    if (SF < 1.5) return '#ff6b35';
    if (SF < 2.0) return '#ffd700';
    return '#00ff00';
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ffd700', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🔩 Material Stress Analysis
      </h2>

      <div className="content-grid">
        {/* HOOP STRESS */}
        <div className="panel">
          <h2>🔄 Hoop Stress (σ_θ)</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat</div>
              <div style={{ fontSize: '1.8rem', color: '#ff6b35' }}>
                {throatStress.sigma_theta_total.toFixed(1)} MPa
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Circumferential stress from pressure
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Pressure Component</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatStress.sigma_theta_pressure.toFixed(1)} MPa
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Wall Thickness</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {throatStress.t_wall.toFixed(1)} mm
              </div>
            </div>
          </div>
        </div>

        {/* THERMAL STRESS */}
        <div className="panel">
          <h2>🌡️ Thermal Stress</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat</div>
              <div style={{ fontSize: '1.8rem', color: '#ff0000' }}>
                {throatStress.sigma_thermal.toFixed(1)} MPa
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {throatStress.sigma_thermal < 0 ? 'Compressive' : 'Tensile'} stress
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Temperature Gradient</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(throatStress.T_hot - throatStress.T_cold).toFixed(0)} K
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Formula</div>
              <div style={{ fontSize: '0.75rem', color: '#00d9ff', fontFamily: 'monospace' }}>
                σ_T = -E·α·ΔT / (1-ν)
              </div>
            </div>
          </div>
        </div>

        {/* VON MISES STRESS */}
        <div className="panel">
          <h2>⚠️ Von Mises Stress</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Equivalent Stress</div>
              <div style={{ fontSize: '1.8rem', color: '#ffd700', fontWeight: 'bold' }}>
                {throatStress.sigma_vm.toFixed(1)} MPa
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Combined loading criterion
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Yield Strength @ {throatStress.T_hot.toFixed(0)}K</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatStress.sigma_y.toFixed(1)} MPa
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Utilization</div>
              <div style={{ 
                width: '100%', 
                height: '20px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{ 
                  width: `${Math.min(100, (throatStress.sigma_vm / throatStress.sigma_y) * 100)}%`, 
                  height: '100%', 
                  background: getSFColor(throatStress.SF),
                  transition: 'width 0.3s'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#000'
                }}>
                  {((throatStress.sigma_vm / throatStress.sigma_y) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAFETY FACTOR */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>🛡️ Safety Factor</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat</div>
              <div style={{ 
                fontSize: '3rem', 
                color: getSFColor(throatStress.SF),
                fontWeight: 'bold'
              }}>
                {throatStress.SF.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                SF = σ_y / σ_vm
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Minimum SF (Whole Engine)</div>
              <div style={{ fontSize: '1.5rem', color: getSFColor(minSF) }}>
                {minSF.toFixed(2)}
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: getSFColor(throatStress.SF) + '20',
              borderRadius: '4px',
              border: `1px solid ${getSFColor(throatStress.SF)}`,
              fontSize: '0.75rem'
            }}>
              {throatStress.failureMode.status}: {throatStress.failureMode.description}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📍 Maximum Stress Location</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Position</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {maxStress.position} cm
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Axial location of peak stress
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Von Mises Stress</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {maxStress.sigma_vm.toFixed(1)} MPa
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Safety Factor</div>
              <div style={{ fontSize: '1.2rem', color: getSFColor(maxStress.SF) }}>
                {maxStress.SF.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🔧 Material Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>Material:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>Copper C18150</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>E:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>128 GPa</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>ν:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>0.34</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>α:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>17×10⁻⁶ /K</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>σ_y (RT):</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>400 MPa</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>σ_y (500°C):</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>250 MPa</span>
            </div>
          </div>
        </div>
      </div>

      {/* STRESS COMPONENTS RADAR */}
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
          📊 Stress Components @ Throat
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Comparison of stress components vs yield strength
        </p>
        
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="stress" stroke="#888" />
            <PolarRadiusAxis stroke="#888" />
            <Radar 
              name="Actual Stress" 
              dataKey="value" 
              stroke="#ffd700" 
              fill="#ffd700" 
              fillOpacity={0.6} 
            />
            <Radar 
              name="Yield Strength" 
              dataKey="fullMark" 
              stroke="#ff0000" 
              fill="#ff0000" 
              fillOpacity={0.2} 
            />
            <Legend />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ffd700',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* VON MISES STRESS DISTRIBUTION */}
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
          ⚠️ Von Mises Stress Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Equivalent stress along engine - failure occurs when σ_vm &gt; σ_y
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stressAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Stress (MPa)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              type="monotone" 
              dataKey="sigma_vm" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="Von Mises Stress (MPa)"
            />
            <Line 
              type="monotone" 
              dataKey="sigma_y" 
              stroke="#ff0000" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Yield Strength (MPa)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* STRESS COMPONENTS DISTRIBUTION */}
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
          🔄 Principal Stress Components
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Hoop, axial, and radial stresses
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stressAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Stress (MPa)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="sigma_theta_total" 
              stroke="#ff6b35" 
              strokeWidth={3}
              dot={false}
              name="Hoop Stress σ_θ (MPa)"
            />
            <Line 
              type="monotone" 
              dataKey="sigma_z_total" 
              stroke="#00d9ff" 
              strokeWidth={2}
              dot={false}
              name="Axial Stress σ_z (MPa)"
            />
            <Line 
              type="monotone" 
              dataKey="sigma_r_total" 
              stroke="#00ff00" 
              strokeWidth={2}
              dot={false}
              name="Radial Stress σ_r (MPa)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SAFETY FACTOR DISTRIBUTION */}
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
          🛡️ Safety Factor Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          SF &lt; 1.0 = Failure, 1.0-1.5 = Warning, 1.5-2.0 = Caution, &gt;2.0 = Safe
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stressAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Safety Factor', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #00ff00',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Bar dataKey="SF" name="Safety Factor">
              {stressAnalysis.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSFColor(entry.SF)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
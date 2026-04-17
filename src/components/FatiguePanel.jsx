import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import { FatigueCreepAnalyzer } from '../physics/fatiguePrediction';

/**
 * FATIGUE & CREEP LIFE PREDICTION PANEL
 * Low-cycle fatigue, thermal cycles, creep damage
 */
export default function FatiguePanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // REALISTIC THERMAL ANALYSIS
  // Wall doesn't reach chamber temp due to regenerative cooling!
  const T_chamber = simParams.chamberTemp;
  const T_coolant = simParams.coolantInletTemp;
  
  // Cooling effectiveness: 70% heat removed
  // Modern regenerative cooling is VERY efficient (90-95%)
  const coolingEfficiency = 0.92; // 92% heat removed
  const T_wall_hot = T_coolant + (T_chamber - T_coolant) * (1 - coolingEfficiency);
  const T_wall_cool = T_coolant + 50; // 50K above coolant during cooldown
  
  const deltaT_realistic = T_wall_hot - T_wall_cool;
  
  // Material properties (Copper C18150)
  const E = 128e9; // Pa
  const alpha = 17e-6; // 1/K
  const nu = 0.34;
  
  // Thermal stress with realistic constraint factor
  // Rocket nozzles have partial constraint (can expand axially)
  // Also, cooling channels create localized gradients (not uniform ΔT)
  const constraintFactor = 0.4; // 40% of fully constrained
  const sigma_thermal = (E * alpha * deltaT_realistic / (1 - nu)) * constraintFactor;
  
  // Pressure stress (hoop stress)
  const P = simParams.chamberPressure * 1e5; // Pa
  const r = (geometry.chamberDiameter || 0.3) / 2;
  
  // Realistic wall thickness for rocket engines
  const pressureFactor = Math.sqrt(Math.max(1.0, simParams.chamberPressure / 100));
  // Thicker wall for high-pressure engines
  const t_wall = 0.008 * pressureFactor; // 8mm base
  
  const sigma_hoop = (P * r) / t_wall;
  
  // Safety checks
  const safeValue = (val) => (isNaN(val) || !isFinite(val) || val < 0) ? 0 : val;
  
  const sigma_thermal_safe = safeValue(Math.abs(sigma_thermal));
  const sigma_hoop_safe = safeValue(sigma_hoop);
  
  // Combined stress
  const sigma_max = sigma_thermal_safe + sigma_hoop_safe;
  const sigma_min = sigma_hoop_safe * 0.5; // Reduced during cooldown
  
  // Create fatigue analyzer with REALISTIC temperatures
  const fatigue = new FatigueCreepAnalyzer({
    sigma_max: sigma_max,
    sigma_min: sigma_min,
    T_max: T_wall_hot,  // NOT chamber temp!
    T_min: T_wall_cool, // NOT coolant inlet!
    cyclesPerFiring: 1,
    firingDuration: 180,
  });
  
  const results = fatigue.getResults();
  
  // Generate S-N curve
  const snCurve = fatigue.generateSNcurve();
  
  // Damage breakdown
  const damageData = [
    { name: 'Fatigue', value: results.damage_fatigue * 100, fill: '#ff6b35' },
    { name: 'Creep', value: results.damage_creep * 100, fill: '#ffd700' },
  ];
  
  // Life comparison
  const lifeComparison = [
    { mode: 'Fatigue', firings: Math.min(results.firings_to_failure_fatigue, 10000) },
    { mode: 'Creep', firings: Math.min(results.firings_to_failure_creep, 10000) },
    { mode: 'Combined', firings: results.firings_to_failure },
  ];
  
  // Failure mode color
  const getFailureModeColor = (mode) => {
    return mode === 'fatigue' ? '#ff6b35' : '#ffd700';
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff0000', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        💀 Fatigue & Creep Life Prediction
      </h2>

      <div className="content-grid">
        {/* PREDICTED LIFE */}
        <div className="panel">
          <h2>🔢 Predicted Life</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Firings to Failure</div>
              <div style={{ fontSize: '2rem', color: '#ff0000', fontWeight: 'bold' }}>
                {results.firings_to_failure.toFixed(0)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {results.failureMode === 'fatigue' ? 'Fatigue-limited' : 'Creep-limited'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Cycles to Failure</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.cycles_to_failure.toExponential(2)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Safety Factor (vs 100 firings)</div>
              <div style={{ fontSize: '1.5rem', color: results.safetyFactor > 2 ? '#00ff00' : results.safetyFactor > 1 ? '#ffd700' : '#ff0000' }}>
                {results.safetyFactor.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* THERMAL FATIGUE */}
        <div className="panel">
          <h2>🌡️ Thermal Fatigue</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Temperature Range (ΔT)</div>
              <div style={{ fontSize: '2rem', color: '#ff6b35', fontWeight: 'bold' }}>
                {results.deltaT.toFixed(0)} K
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Per firing cycle
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thermal Strain Range</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.epsilon_thermal * 100).toFixed(4)}%
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Fatigue Life (Thermal)</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {results.N_f_thermal.toExponential(2)} cycles
              </div>
            </div>
          </div>
        </div>

        {/* MECHANICAL STRESS */}
        <div className="panel">
          <h2>⚙️ Mechanical Stress</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Stress Range (Δσ)</div>
              <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                {(results.deltaStress / 1e6).toFixed(1)} MPa
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Mean Stress</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.sigma_mean / 1e6).toFixed(1)} MPa
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Fatigue Life (Mechanical)</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {results.N_f_mechanical.toExponential(2)} cycles
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREEP ANALYSIS */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>🐌 Creep Analysis</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Creep Rate</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700', fontWeight: 'bold' }}>
                {results.creepRate.toExponential(2)} s⁻¹
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Norton's Law: ε̇ = A·σⁿ·exp(-Q/RT)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Creep Strain per Firing</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(results.creepStrain_perFiring * 100).toFixed(6)}%
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Firings to Creep Failure</div>
              <div style={{ fontSize: '1.2rem', color: '#ff0000' }}>
                {results.firings_to_creep_failure.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📊 Cumulative Damage</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Damage (Miner's Rule)</div>
              <div style={{ fontSize: '1.5rem', color: results.damage_total > 1 ? '#ff0000' : '#00ff00', fontWeight: 'bold' }}>
                {results.damage_total.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                D ≥ 1.0 → Failure
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Fatigue Damage</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {results.damage_fatigue.toFixed(3)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Creep Damage</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {results.damage_creep.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🎯 Failure Mode</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Limiting Mechanism</div>
              <div style={{ 
                fontSize: '2rem', 
                color: getFailureModeColor(results.failureMode),
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {results.failureMode}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Larson-Miller Parameter</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.LMP.toFixed(0)}
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: getFailureModeColor(results.failureMode) + '20',
              borderRadius: '4px',
              border: `1px solid ${getFailureModeColor(results.failureMode)}`,
              fontSize: '0.75rem'
            }}>
              {results.failureMode === 'fatigue' 
                ? 'Failure due to cyclic loading' 
                : 'Failure due to high-temperature creep'}
            </div>
          </div>
        </div>
      </div>

      {/* DAMAGE BREAKDOWN */}
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
          📊 Damage Breakdown (per 100 firings)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Miner's Rule: D = Σ(n_i / N_i)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={damageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="name" 
              stroke="#888"
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Damage (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Bar dataKey="value" name="Damage (%)">
              {damageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LIFE COMPARISON */}
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
          📈 Life Prediction Comparison
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Firings to failure by different mechanisms
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lifeComparison} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              type="number"
              stroke="#888"
              label={{ value: 'Firings to Failure', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              type="category"
              dataKey="mode" 
              stroke="#888"
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
            <Bar dataKey="firings" name="Firings" fill="#00d9ff" />
          </BarChart>
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
            Design Recommendations:
          </div>
          <div>• Target design life: 100-200 firings for reusable engines</div>
          <div>• Apply safety factor of 2-3× for critical components</div>
          <div>• {results.failureMode === 'fatigue' ? 'Consider shot-peening or surface treatments to improve fatigue life' : 'Use advanced alloys with better creep resistance at high temperatures'}</div>
        </div>
      </div>

      {/* S-N CURVE */}
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
          📉 S-N Curve (Stress-Life)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Basquin Equation: Δσ/2 = σ'_f · (2N_f)^b
        </p>
        
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              type="number"
              dataKey="cycles"
              stroke="#888"
              scale="log"
              domain={[10, 1e10]}
              label={{ value: 'Cycles to Failure (N_f)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              type="number"
              dataKey="stress"
              stroke="#888"
              label={{ value: 'Stress Amplitude (MPa)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ffd700',
                borderRadius: '4px',
                color: '#fff'
              }}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Scatter 
              data={snCurve} 
              fill="#ffd700"
              line={{ stroke: '#ffd700', strokeWidth: 3 }}
              name="Fatigue Strength"
            />
          </ScatterChart>
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
          📐 Fatigue & Creep Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Coffin-Manson (Low-Cycle Fatigue):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              Δε/2 = ε'_f · (2N_f)^c
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Norton's Creep Law:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              dε/dt = A · σⁿ · exp(-Q/RT)
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Miner's Rule (Cumulative Damage):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              D = Σ(n_i / N_i) ≥ 1.0 → Failure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
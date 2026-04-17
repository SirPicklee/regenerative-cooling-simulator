import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import { GasRadiation, CombinedHeatTransfer, ViewFactor, EMISSIVITY, radiationHeatFlux } from '../physics/radiation';
import { MaterialHelpers } from '../physics/materials';

/**
 * RADIATION HEAT TRANSFER ANALYSIS PANEL
 * Stefan-Boltzmann, gas radiation, combined convection+radiation
 */
export default function RadiationPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze radiation at each axial position
  const radiationAnalysis = [];
  const axialPositions = fullThermalResults.axialPositions;
  
  for (let i = 0; i < axialPositions.length; i++) {
    const x = axialPositions[i];
    const T_gas = fullThermalResults.gasTemp[i];
    const T_wall_hot = fullThermalResults.wallTempHot[i];
    const q_total = fullThermalResults.heatFlux[i];
    
    // Get geometry properties
    const radius = geometry.getRadius(x);
    const L_mean = radius * 2; // Mean beam length ≈ 2R for cylinder
    
    // Calculate gas radiation
    const P_gas = simParams.chamberPressure * 1e5; // Convert to Pa
    const gasRad = new GasRadiation(T_gas, P_gas, L_mean);
    const gasRadResults = gasRad.getResults();
    
    // Estimate convective heat transfer coefficient from total heat flux
    // q_total ≈ h_conv * (T_gas - T_wall) + q_rad
    // We'll iterate to find h_conv
    
    // Simple approach: assume initial h_conv from existing data
    const h_conv_estimate = q_total / (T_gas - T_wall_hot);
    
    // View factor (concentric cylinders approximation)
    const r_inner = radius;
    const r_outer = radius + 0.01; // Simplified
    const viewFactor = ViewFactor.chamberGeometry(r_inner, r_outer, geometry.L_total);
    
    // Combined heat transfer analysis
    const combined = new CombinedHeatTransfer({
      T_gas: T_gas,
      T_wall: T_wall_hot,
      h_conv: h_conv_estimate,
      epsilon_gas: gasRadResults.epsilon_gas,
      epsilon_wall: EMISSIVITY.COPPER_OXIDIZED, // Oxidized copper at high temp
      viewFactor: viewFactor,
    });
    
    const combResults = combined.getResults();
    
    // Pure radiation heat flux (surface-to-surface)
    const q_rad_surface = radiationHeatFlux(
      T_gas,
      T_wall_hot,
      gasRadResults.epsilon_gas,
      EMISSIVITY.COPPER_OXIDIZED
    );
    
    radiationAnalysis.push({
      position: (x * 100).toFixed(1), // cm
      x: x,
      T_gas: T_gas,
      T_wall: T_wall_hot,
      epsilon_CO2: gasRadResults.epsilon_CO2,
      epsilon_H2O: gasRadResults.epsilon_H2O,
      epsilon_gas: gasRadResults.epsilon_gas,
      q_conv: combResults.q_conv / 1e6, // MW/m²
      q_rad: combResults.q_rad / 1e6, // MW/m²
      q_total: combResults.q_total / 1e6, // MW/m²
      radiationFraction: combResults.radiationFraction * 100, // Percentage
      h_total: combResults.h_total / 1000, // kW/(m²·K)
      viewFactor: viewFactor,
    });
  }
  
  // Find throat analysis
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = radiationAnalysis.findIndex(item => Math.abs(item.x - throatX) < 0.01);
  const throatRad = radiationAnalysis[throatIndex] || radiationAnalysis[Math.floor(radiationAnalysis.length / 2)];
  
  // Overall averages
  const avgRadFraction = radiationAnalysis.reduce((sum, r) => sum + r.radiationFraction, 0) / radiationAnalysis.length;
  const maxRadFraction = Math.max(...radiationAnalysis.map(r => r.radiationFraction));
  const avgEpsilonGas = radiationAnalysis.reduce((sum, r) => sum + r.epsilon_gas, 0) / radiationAnalysis.length;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff0000', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        ☀️ Radiation Heat Transfer Analysis
      </h2>

      <div className="content-grid">
        {/* GAS EMISSIVITY */}
        <div className="panel">
          <h2>🌫️ Gas Emissivity</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>CO₂ Emissivity @ Throat</div>
              <div style={{ fontSize: '1.5rem', color: '#ff6b35' }}>
                ε = {throatRad.epsilon_CO2.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Carbon dioxide radiation
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>H₂O Emissivity @ Throat</div>
              <div style={{ fontSize: '1.5rem', color: '#0088ff' }}>
                ε = {throatRad.epsilon_H2O.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Water vapor radiation
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Gas Emissivity</div>
              <div style={{ fontSize: '1.8rem', color: '#ffd700', fontWeight: 'bold' }}>
                ε = {throatRad.epsilon_gas.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Combined with overlap correction
              </div>
            </div>
          </div>
        </div>

        {/* HEAT FLUX BREAKDOWN */}
        <div className="panel">
          <h2>🔥 Heat Flux Breakdown</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Convective Heat Flux</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {throatRad.q_conv.toFixed(2)} MW/m²
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '0.5rem'
              }}>
                <div style={{ 
                  width: `${100 - throatRad.radiationFraction}%`, 
                  height: '100%', 
                  background: '#00d9ff' 
                }}></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Radiation Heat Flux</div>
              <div style={{ fontSize: '1.5rem', color: '#ff0000' }}>
                {throatRad.q_rad.toFixed(2)} MW/m²
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '0.5rem'
              }}>
                <div style={{ 
                  width: `${throatRad.radiationFraction}%`, 
                  height: '100%', 
                  background: '#ff0000' 
                }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Heat Flux</div>
              <div style={{ fontSize: '1.8rem', color: '#ffd700', fontWeight: 'bold' }}>
                {throatRad.q_total.toFixed(2)} MW/m²
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Radiation: {throatRad.radiationFraction.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* RADIATION FRACTION */}
        <div className="panel">
          <h2>📊 Radiation Contribution</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat Region</div>
              <div style={{ fontSize: '2.5rem', color: '#ff0000', fontWeight: 'bold' }}>
                {throatRad.radiationFraction.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Average Along Engine</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {avgRadFraction.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Maximum</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {maxRadFraction.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: avgRadFraction > 30 ? '#ff000020' : avgRadFraction > 15 ? '#ffd70020' : '#00ff0020',
              borderRadius: '4px',
              border: `1px solid ${avgRadFraction > 30 ? '#ff0000' : avgRadFraction > 15 ? '#ffd700' : '#00ff00'}`,
              fontSize: '0.75rem'
            }}>
              {avgRadFraction > 30 
                ? '🔥 High radiation - important contributor'
                : avgRadFraction > 15
                ? '⚠️ Moderate radiation effects'
                : '✅ Convection dominated'}
            </div>
          </div>
        </div>
      </div>

      {/* GAS EMISSIVITY DISTRIBUTION */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#ff0000', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          🌫️ Gas Emissivity Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          CO₂, H₂O, and combined gas emissivity along engine
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={radiationAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Emissivity (ε)', angle: -90, position: 'insideLeft', fill: '#888' }}
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ff0000',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="epsilon_CO2" 
              stroke="#ff6b35" 
              strokeWidth={2}
              dot={false}
              name="ε (CO₂)"
            />
            <Line 
              type="monotone" 
              dataKey="epsilon_H2O" 
              stroke="#0088ff" 
              strokeWidth={2}
              dot={false}
              name="ε (H₂O)"
            />
            <Line 
              type="monotone" 
              dataKey="epsilon_gas" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="ε (Total Gas)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CONVECTION VS RADIATION */}
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
          🔥 Convection vs Radiation Heat Flux
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Comparison of heat transfer mechanisms
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={radiationAnalysis}>
            <defs>
              <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00d9ff" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="radGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff0000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ff0000" stopOpacity={0.2}/>
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
              label={{ value: 'Heat Flux (MW/m²)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="q_conv" 
              stackId="1"
              stroke="#00d9ff" 
              fill="url(#convGradient)"
              name="Convective (MW/m²)"
            />
            <Area 
              type="monotone" 
              dataKey="q_rad" 
              stackId="1"
              stroke="#ff0000" 
              fill="url(#radGradient)"
              name="Radiative (MW/m²)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* RADIATION FRACTION ALONG ENGINE */}
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
          📈 Radiation Fraction Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Percentage of total heat flux from radiation
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={radiationAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Radiation Fraction (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
              domain={[0, 'auto']}
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
              dataKey="radiationFraction" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="Radiation Fraction (%)"
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
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#fff' }}>
            Stefan-Boltzmann Law:
          </div>
          <div style={{ fontFamily: 'monospace', color: '#ffd700' }}>
            q_rad = ε_eff · σ · (T_gas⁴ - T_wall⁴)
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            where σ = 5.67×10⁻⁸ W/(m²·K⁴)
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import { TwoPhaseFlowAnalyzer } from '../physics/twoPhaseFlow';

/**
 * TWO-PHASE FLOW ANALYSIS PANEL
 * Boiling, CHF, void fraction, flow regimes
 */
export default function TwoPhaseFlowPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Analyze two-phase flow at multiple locations
  const twoPhaseAnalysis = [];
  
  // Use existing thermal data
  const numPoints = fullThermalResults.gasTemp ? fullThermalResults.gasTemp.length : 61;
  const totalLength = geometry.L_chamber + geometry.L_convergent + geometry.L_nozzle;
  
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * totalLength;
    
    // Get temperatures - use available data or estimate
    const T_gas = fullThermalResults.gasTemp ? fullThermalResults.gasTemp[i] : simParams.chamberTemp;
    // Wall temperature: cooled by regenerative cooling
    // But still hot (200-400K range for high heat flux zones)
    const T_wall = 200 + (T_gas - 200) * 0.15; // 15% of gas temp gradient
    const T_coolant = simParams.coolantInletTemp + (i / numPoints) * 30; // Coolant heats ~30K total
    // Coolant pressure: slightly above chamber to prevent backflow
    // But not too high (avoid supercritical CH4, P_crit = 46 bar)
    const P_coolant = Math.min(simParams.chamberPressure * 1.05e5, 40e5); // Max 40 bar
    
    // Cooling channel geometry
    const numChannels = 360;
    const channelWidth = 0.002; // 2mm
    const channelHeight = 0.003; // 3mm
    const A_channel = channelWidth * channelHeight;
    const D_h = 2 * channelWidth * channelHeight / (channelWidth + channelHeight);
    const massFlowRate_perChannel = simParams.massFlowRate / numChannels;
    
    // Heat transfer coefficient estimate (Dittus-Boelter approximation)
    const h_conv = 15000; // W/(m²·K) - typical for high velocity coolant
    
    // Create analyzer
    try {
      // Debug: ilk noktayı log'la
      if (i === 0) {
        console.log('Two-Phase Debug:', {
          P_coolant,
          T_coolant,
          T_wall,
          massFlowRate_perChannel,
        });
      }
      
      const analyzer = new TwoPhaseFlowAnalyzer({
        P: P_coolant,
        T_bulk: T_coolant,
        T_wall: T_wall,
        massFlowRate: massFlowRate_perChannel,
        D_h: D_h,
        A_flow: A_channel,
        h_conv: h_conv,
      });
      
      const results = analyzer.getResults();
      
      twoPhaseAnalysis.push({
        position: (x * 100).toFixed(1), // cm
        x: x,
        T_sat: results.T_sat,
        deltaT_sub: results.deltaT_sub,
        isBoiling: results.isBoiling,
        q_ONB: results.q_ONB / 1e6, // MW/m²
        q_CHF: results.q_CHF / 1e6, // MW/m²
        CHF_ratio: results.CHF_ratio * 100, // %
        alpha: results.alpha * 100, // %
        x_e: results.x_e * 100, // %
        h_tp: results.h_tp / 1000, // kW/(m²·K)
        h_nb: results.h_nb / 1000,
        h_sp: results.h_sp / 1000,
        regime: results.regime,
        G: results.G,
      });
    } catch (error) {
      // Skip problematic points
      console.warn('Two-phase analysis failed at position:', x, error);
    }
  }
  
  if (twoPhaseAnalysis.length === 0) {
    return (
      <div style={{ marginTop: '2rem', padding: '2rem', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #333' }}>
        <h2 style={{ fontFamily: 'Orbitron', color: '#0088ff' }}>💧 Two-Phase Flow Analysis</h2>
        <p style={{ color: '#888', marginTop: '1rem' }}>
          Analysis failed. Check simulation parameters.
        </p>
      </div>
    );
  }
  
  // Find throat location
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = twoPhaseAnalysis.findIndex(item => Math.abs(item.x - throatX) < 0.01);
  const throatAnalysis = twoPhaseAnalysis[throatIndex] || twoPhaseAnalysis[Math.floor(twoPhaseAnalysis.length / 2)];
  
  // Find max CHF ratio location
  let maxCHF = twoPhaseAnalysis[0];
  for (const item of twoPhaseAnalysis) {
    if (item.CHF_ratio > maxCHF.CHF_ratio) {
      maxCHF = item;
    }
  }
  
  // Count boiling regions
  const boilingRegions = twoPhaseAnalysis.filter(item => item.isBoiling).length;
  const boilingPercentage = (boilingRegions / twoPhaseAnalysis.length) * 100;
  
  // Flow regime distribution
  const regimeCount = {};
  twoPhaseAnalysis.forEach(item => {
    regimeCount[item.regime] = (regimeCount[item.regime] || 0) + 1;
  });
  
  const regimeData = Object.entries(regimeCount).map(([name, count]) => ({
    name: name.replace('-', ' ').toUpperCase(),
    count: count,
    percentage: (count / twoPhaseAnalysis.length * 100).toFixed(1),
  })).sort((a, b) => b.count - a.count);
  
  // CHF safety status color
  const getCHFColor = (ratio) => {
    if (ratio < 50) return '#00ff00'; // Safe
    if (ratio < 80) return '#ffd700'; // Caution
    return '#ff0000'; // Danger
  };
  
  // Regime colors
  const getRegimeColor = (regime) => {
    const colors = {
      'single-phase': '#0088ff',
      'bubbly': '#00d9ff',
      'slug': '#ffd700',
      'churn': '#ff6b35',
      'annular': '#ff00ff',
      'mist': '#00ff00',
    };
    return colors[regime] || '#888';
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#0088ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        💧 Two-Phase Flow Analysis (Coolant Boiling)
      </h2>

      <div className="content-grid">
        {/* BOILING STATUS */}
        <div className="panel">
          <h2>🔥 Boiling Status</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Boiling Regions</div>
              <div style={{ fontSize: '2rem', color: boilingPercentage > 0 ? '#ff6b35' : '#00ff00', fontWeight: 'bold' }}>
                {boilingPercentage.toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {boilingRegions} / {twoPhaseAnalysis.length} locations
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat</div>
              <div style={{ fontSize: '1.2rem', color: throatAnalysis.isBoiling ? '#ff6b35' : '#00d9ff' }}>
                {throatAnalysis.isBoiling ? 'BOILING' : 'SUBCOOLED'}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Subcooling (Throat)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatAnalysis.deltaT_sub.toFixed(1)} K
              </div>
            </div>
          </div>
        </div>

        {/* CRITICAL HEAT FLUX */}
        <div className="panel">
          <h2>⚠️ Critical Heat Flux</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max CHF Ratio</div>
              <div style={{ fontSize: '2rem', color: getCHFColor(maxCHF.CHF_ratio), fontWeight: 'bold' }}>
                {maxCHF.CHF_ratio.toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {maxCHF.CHF_ratio < 80 ? 'SAFE' : 'DNB RISK!'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Location</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {maxCHF.position} cm
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>CHF Value</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {maxCHF.q_CHF.toFixed(1)} MW/m²
              </div>
            </div>
          </div>
        </div>

        {/* VOID FRACTION */}
        <div className="panel">
          <h2>💨 Void Fraction</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Void Fraction</div>
              <div style={{ fontSize: '2rem', color: '#00d9ff', fontWeight: 'bold' }}>
                {Math.max(...twoPhaseAnalysis.map(d => d.alpha)).toFixed(1)}%
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Vapor volume fraction
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>At Throat</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {throatAnalysis.alpha.toFixed(2)}%
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Flow Model</div>
              <div style={{ fontSize: '1.0rem', color: '#ffd700' }}>
                Drift Flux
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOW REGIME */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>🌊 Flow Regime</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Dominant Regime</div>
              <div style={{ 
                fontSize: '1.5rem', 
                color: getRegimeColor(regimeData[0]?.name.toLowerCase().replace(' ', '-') || 'single-phase'),
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {regimeData[0]?.name || 'SINGLE-PHASE'}
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem' }}>
              {regimeData.slice(0, 3).map((regime, idx) => (
                <div key={idx} style={{ 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  background: '#1a1a1a',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${getRegimeColor(regime.name.toLowerCase().replace(' ', '-'))}`
                }}>
                  <div style={{ color: '#fff' }}>{regime.name}</div>
                  <div style={{ color: '#888' }}>{regime.percentage}% ({regime.count} locations)</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🔬 Saturation Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>T_sat (Throat)</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {throatAnalysis.T_sat.toFixed(1)} K
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Latent Heat (h_fg)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                510 kJ/kg
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Mass Flux (G)</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(throatAnalysis.G / 1000).toFixed(1)} kg/(m²·s)
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📊 Heat Transfer</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Two-Phase HTC</div>
              <div style={{ fontSize: '1.5rem', color: '#00ff00' }}>
                {throatAnalysis.h_tp.toFixed(1)} kW/(m²·K)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Nucleate Boiling</div>
              <div style={{ fontSize: '1.2rem', color: '#ff6b35' }}>
                {throatAnalysis.h_nb.toFixed(1)} kW/(m²·K)
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Convective</div>
              <div style={{ fontSize: '1.2rem', color: '#0088ff' }}>
                {throatAnalysis.h_sp.toFixed(1)} kW/(m²·K)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHF SAFETY MARGIN */}
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
          ⚠️ CHF Safety Margin (DNB Prevention)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Ratio of actual heat flux to Critical Heat Flux - must stay below 80%
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={twoPhaseAnalysis}>
            <defs>
              <linearGradient id="chfGradient" x1="0" y1="0" x2="0" y2="1">
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
              domain={[0, 100]}
              label={{ value: 'CHF Ratio (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="CHF_ratio" 
              stroke="#ff6b35" 
              fill="url(#chfGradient)"
              strokeWidth={3}
              name="CHF Ratio (%)"
            />
            <Line 
              type="monotone" 
              dataKey={() => 80} 
              stroke="#ff0000" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="DNB Limit (80%)"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          background: maxCHF.CHF_ratio > 80 ? '#ff000020' : '#00ff0020',
          borderRadius: '4px',
          border: `1px solid ${maxCHF.CHF_ratio > 80 ? '#ff0000' : '#00ff00'}`,
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
            {maxCHF.CHF_ratio > 80 ? '⚠️ WARNING: DNB Risk!' : '✅ SAFE: Good CHF Margin'}
          </div>
          <div style={{ color: '#888' }}>
            {maxCHF.CHF_ratio > 80 
              ? 'Critical Heat Flux exceeded! Risk of Departure from Nucleate Boiling. Increase coolant flow or reduce heat flux.'
              : 'All cooling channels operating safely below CHF limit. No boiling crisis risk.'}
          </div>
        </div>
      </div>

      {/* VOID FRACTION DISTRIBUTION */}
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
          💨 Void Fraction Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Percentage of channel occupied by vapor (α)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={twoPhaseAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Void Fraction (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="alpha" 
              stroke="#00d9ff" 
              strokeWidth={3}
              dot={false}
              name="Void Fraction (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SUBCOOLING */}
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
          ❄️ Subcooling (ΔT_sub = T_sat - T_bulk)
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Negative subcooling indicates superheated (boiling) conditions
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={twoPhaseAnalysis}>
            <defs>
              <linearGradient id="subGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffd700" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffd700" stopOpacity={0.1}/>
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
              label={{ value: 'Subcooling (K)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
            <Area 
              type="monotone" 
              dataKey="deltaT_sub" 
              stroke="#ffd700" 
              fill="url(#subGradient)"
              strokeWidth={3}
              name="Subcooling (K)"
            />
          </AreaChart>
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
          color: '#00ff00', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          📐 Two-Phase Flow Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Critical Heat Flux (Bowring):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              q_CHF = (A + B·x_e) · G · h_fg
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Void Fraction (Drift Flux):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              α = x / (C₀·ρ_g/ρ_f + x·(1 - ρ_g/ρ_f))
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Chen Correlation (Two-Phase HTC):
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              h_tp = F·h_sp + S·h_nb
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
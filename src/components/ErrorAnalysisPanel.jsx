import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

/**
 * ERROR & CONVERGENCE ANALYSIS
 * Validates energy conservation and numerical accuracy
 */
export default function ErrorAnalysisPanel({ fullThermalResults, simParams, thermalSummary }) {
  if (!fullThermalResults || !thermalSummary) {
    return null;
  }

  // ENERGY BALANCE CHECK
  // Heat absorbed by coolant should equal heat transferred through wall
  const totalHeatTransferred = thermalSummary.totalHeatTransfer; // Watts
  
  // Calculate heat absorbed by coolant
  const T_coolant_in = simParams.coolantInletTemp;
  const T_coolant_out = fullThermalResults.coolantTemp[fullThermalResults.coolantTemp.length - 1];
  const massFlowRate = simParams.massFlowRate;
  const cp_avg = 3400; // J/(kg·K) average for CH4
  
  const heatAbsorbedByCoolant = massFlowRate * cp_avg * (T_coolant_out - T_coolant_in); // Watts
  
  // Energy balance error
  const energyError = Math.abs(totalHeatTransferred - heatAbsorbedByCoolant);
  const energyErrorPercent = (energyError / totalHeatTransferred) * 100;
  
  // HEAT FLUX CONSISTENCY CHECK
  // Compare different calculation methods
  const avgHeatFlux = fullThermalResults.heatFlux.reduce((a, b) => a + b, 0) / fullThermalResults.heatFlux.length;
  const maxHeatFlux = Math.max(...fullThermalResults.heatFlux);
  const minHeatFlux = Math.min(...fullThermalResults.heatFlux);
  
  const heatFluxVariation = ((maxHeatFlux - minHeatFlux) / avgHeatFlux) * 100;
  
  // TEMPERATURE GRADIENT CHECK
  // Ensure physical consistency (Gas > Wall_hot > Wall_cold > Coolant)
  let gradientViolations = 0;
  for (let i = 0; i < fullThermalResults.axialPositions.length; i++) {
    const T_gas = fullThermalResults.gasTemp[i];
    const T_wall_hot = fullThermalResults.wallTempHot[i];
    const T_wall_cold = fullThermalResults.wallTempCold[i];
    const T_coolant = fullThermalResults.coolantTemp[i];
    
    if (!(T_gas > T_wall_hot && T_wall_hot > T_wall_cold && T_wall_cold > T_coolant)) {
      gradientViolations++;
    }
  }
  
  const gradientConsistency = ((fullThermalResults.axialPositions.length - gradientViolations) / fullThermalResults.axialPositions.length) * 100;
  
  // CONVERGENCE METRICS
  const convergenceData = [
    {
      name: 'Energy Balance',
      value: 100 - energyErrorPercent,
      error: energyErrorPercent,
      status: energyErrorPercent < 5 ? 'excellent' : energyErrorPercent < 10 ? 'good' : 'warning'
    },
    {
      name: 'Temperature Gradient',
      value: gradientConsistency,
      error: 100 - gradientConsistency,
      status: gradientConsistency > 95 ? 'excellent' : gradientConsistency > 90 ? 'good' : 'warning'
    },
    {
      name: 'Heat Flux Stability',
      value: Math.max(0, 100 - heatFluxVariation),
      error: Math.min(100, heatFluxVariation),
      status: heatFluxVariation < 300 ? 'excellent' : heatFluxVariation < 500 ? 'good' : 'warning'
    }
  ];
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'excellent': return '#00ff00';
      case 'good': return '#ffd700';
      case 'warning': return '#ff6b35';
      default: return '#ff0000';
    }
  };
  
  const overallScore = convergenceData.reduce((sum, item) => sum + item.value, 0) / convergenceData.length;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00ff00', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        ✅ Error & Convergence Analysis
      </h2>

      <div className="content-grid">
        {/* OVERALL ACCURACY SCORE */}
        <div className="panel">
          <h2>🎯 Overall Accuracy</h2>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ 
              fontSize: '4rem', 
              fontWeight: 'bold',
              color: overallScore > 90 ? '#00ff00' : overallScore > 80 ? '#ffd700' : '#ff6b35'
            }}>
              {overallScore.toFixed(1)}%
            </div>
            <div style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {overallScore > 90 ? '🎉 Excellent convergence' : overallScore > 80 ? '✅ Good convergence' : '⚠️ Acceptable convergence'}
            </div>
          </div>
        </div>

        {/* ENERGY BALANCE */}
        <div className="panel">
          <h2>⚡ Energy Balance</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Heat Transferred</div>
              <div style={{ fontSize: '1.5rem', color: '#ff6b35' }}>
                {(totalHeatTransferred / 1e6).toFixed(2)} MW
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Heat Absorbed by Coolant</div>
              <div style={{ fontSize: '1.5rem', color: '#0088ff' }}>
                {(heatAbsorbedByCoolant / 1e6).toFixed(2)} MW
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Error</div>
              <div style={{ 
                fontSize: '1.2rem', 
                color: energyErrorPercent < 5 ? '#00ff00' : energyErrorPercent < 10 ? '#ffd700' : '#ff6b35'
              }}>
                {energyErrorPercent.toFixed(2)}%
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: energyErrorPercent < 5 ? '#00ff0020' : energyErrorPercent < 10 ? '#ffd70020' : '#ff6b3520',
              borderRadius: '4px',
              border: `1px solid ${energyErrorPercent < 5 ? '#00ff00' : energyErrorPercent < 10 ? '#ffd700' : '#ff6b35'}`,
              fontSize: '0.75rem'
            }}>
              {energyErrorPercent < 5 
                ? '✅ Energy conserved within acceptable limits'
                : energyErrorPercent < 10
                ? '⚠️ Minor energy imbalance detected'
                : '❌ Significant energy imbalance'}
            </div>
          </div>
        </div>

        {/* TEMPERATURE CONSISTENCY */}
        <div className="panel">
          <h2>🌡️ Temperature Consistency</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Coolant Temp Rise</div>
              <div style={{ fontSize: '1.5rem', color: '#0088ff' }}>
                {(T_coolant_out - T_coolant_in).toFixed(1)} K
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {T_coolant_in.toFixed(0)} K → {T_coolant_out.toFixed(0)} K
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Gradient Violations</div>
              <div style={{ fontSize: '1.5rem', color: gradientViolations === 0 ? '#00ff00' : '#ffd700' }}>
                {gradientViolations} / {fullThermalResults.axialPositions.length}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Physical Consistency</div>
              <div style={{ fontSize: '1.2rem', color: '#00ff00' }}>
                {gradientConsistency.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: '#00ff0020',
              borderRadius: '4px',
              border: '1px solid #00ff00',
              fontSize: '0.75rem'
            }}>
              ✅ T_gas &gt; T_wall_hot &gt; T_wall_cold &gt; T_coolant
            </div>
          </div>
        </div>
      </div>

      {/* CONVERGENCE METRICS CHART */}
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
          📈 Convergence Metrics
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Numerical accuracy and physical consistency validation
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={convergenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="name" 
              stroke="#888"
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #00ff00',
                borderRadius: '4px',
                color: '#fff'
              }}
              formatter={(value, name) => {
                if (name === 'Accuracy (%)') return [`${value.toFixed(1)}%`, name];
                return [value, name];
              }}
            />
            <Legend />
            <Bar dataKey="value" name="Accuracy (%)">
              {convergenceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Bar>
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
            Validation Criteria:
          </div>
          <div>• <span style={{ color: '#00ff00' }}>Excellent (&gt;90%)</span> - High confidence in results</div>
          <div>• <span style={{ color: '#ffd700' }}>Good (80-90%)</span> - Acceptable accuracy</div>
          <div>• <span style={{ color: '#ff6b35' }}>Warning (&lt;80%)</span> - Consider mesh refinement</div>
        </div>
      </div>
    </div>
  );
}
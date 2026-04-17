import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

/**
 * HEAT FLUX DISTRIBUTION CHART
 */
export default function HeatFluxChart({ thermalResults, geometry }) {
  if (!thermalResults || !thermalResults.axialPositions) {
    return null;
  }

  // Prepare data for chart
  const chartData = thermalResults.axialPositions.map((x, i) => ({
    position: (x * 100).toFixed(1), // Convert to cm
    heatFlux: (thermalResults.heatFlux[i] / 1e6).toFixed(2), // Convert to MW/m²
    wallTempHot: (thermalResults.wallTempHot[i] - 273.15).toFixed(0), // Convert to °C
    wallTempCold: (thermalResults.wallTempCold[i] - 273.15).toFixed(0), // Convert to °C
    coolantTemp: (thermalResults.coolantTemp[i] - 273.15).toFixed(0), // Convert to °C
    gasTemp: (thermalResults.gasTemp[i] - 273.15).toFixed(0), // Convert to °C
  }));

  // Find throat position for marker
  const throatPosition = ((geometry.L_chamber + geometry.L_convergent) * 100).toFixed(1);

  return (
    <div style={{ width: '100%' }}>
      {/* HEAT FLUX CHART */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#ff6b35', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          🔥 Heat Flux Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Peak at throat region ({throatPosition} cm) - Critical cooling zone
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="heatFluxGradient" x1="0" y1="0" x2="0" y2="1">
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
              label={{ value: 'Heat Flux (MW/m²)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="heatFlux" 
              stroke="#ff6b35" 
              fill="url(#heatFluxGradient)"
              strokeWidth={3}
              name="Heat Flux (MW/m²)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* TEMPERATURE DISTRIBUTION CHART */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#00d9ff', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          🌡️ Temperature Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Gas → Wall → Coolant temperature gradient
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#888' }}
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
              dataKey="gasTemp" 
              stroke="#ff0000" 
              strokeWidth={2}
              dot={false}
              name="Gas Temp (°C)"
            />
            <Line 
              type="monotone" 
              dataKey="wallTempHot" 
              stroke="#ffa500" 
              strokeWidth={2}
              dot={false}
              name="Wall Hot Side (°C)"
            />
            <Line 
              type="monotone" 
              dataKey="wallTempCold" 
              stroke="#ffff00" 
              strokeWidth={2}
              dot={false}
              name="Wall Cold Side (°C)"
            />
            <Line 
              type="monotone" 
              dataKey="coolantTemp" 
              stroke="#0088ff" 
              strokeWidth={3}
              dot={false}
              name="Coolant Temp (°C)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
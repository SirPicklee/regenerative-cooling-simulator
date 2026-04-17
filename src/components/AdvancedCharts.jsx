import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';

/**
 * ADVANCED CHARTS - Pressure, Velocity, Mach Number
 */
export default function AdvancedCharts({ thermalResults, geometry, simParams }) {
  if (!thermalResults || !thermalResults.axialPositions) {
    return null;
  }

  // Prepare data for charts
  const chartData = thermalResults.axialPositions.map((x, i) => {
    // Calculate local properties
    const section = geometry.getSection(x);
    const area = geometry.getArea(x);
    const radius = geometry.getRadius(x);
    const machNumber = geometry.getMachNumber(x);
    
    // Pressure calculation (isentropic expansion)
    const gamma = 1.25;
    const P_chamber = simParams.chamberPressure * 1e5; // Convert bar to Pa
    const A_throat = geometry.getArea(geometry.L_chamber + geometry.L_convergent);
    const area_ratio = area / A_throat;
    
    let pressure;
    if (section === 'chamber') {
      pressure = P_chamber;
    } else if (section === 'throat') {
      pressure = P_chamber * 0.58; // Critical pressure ratio
    } else {
      // Nozzle expansion
      const P_ratio = Math.pow(area_ratio, -gamma);
      pressure = P_chamber * 0.58 * P_ratio;
    }
    
    // Velocity calculation (from Mach number)
    const T_chamber = simParams.chamberTemp;
    const R_specific = 8314.46 / 25; // J/(kg·K) for combustion products
    const speedOfSound = Math.sqrt(gamma * R_specific * T_chamber);
    const velocity = machNumber * speedOfSound;
    
    return {
      position: (x * 100).toFixed(1), // cm
      pressure: (pressure / 1e5).toFixed(1), // bar
      velocity: (velocity).toFixed(0), // m/s
      machNumber: machNumber.toFixed(2),
      area: (area * 1e4).toFixed(1), // cm²
      radius: (radius * 100).toFixed(1), // cm
    };
  });

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00d9ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        📈 Flow Properties Distribution
      </h2>

      {/* PRESSURE DISTRIBUTION */}
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
          💪 Pressure Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Isentropic expansion through nozzle
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
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
            <Area 
              type="monotone" 
              dataKey="pressure" 
              stroke="#ff6b35" 
              fill="url(#pressureGradient)"
              strokeWidth={3}
              name="Pressure (bar)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* VELOCITY & MACH NUMBER */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#00d9ff', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          🚀 Velocity & Mach Number
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Supersonic acceleration in divergent nozzle
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
              yAxisId="left"
              stroke="#888"
              label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#888"
              label={{ value: 'Mach Number', angle: 90, position: 'insideRight', fill: '#888' }}
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
              yAxisId="left"
              type="monotone" 
              dataKey="velocity" 
              stroke="#00d9ff" 
              strokeWidth={3}
              dot={false}
              name="Velocity (m/s)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="machNumber" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="Mach Number"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AREA VARIATION */}
      <div style={{ 
        background: '#0a0a0a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ 
          fontFamily: 'Orbitron', 
          color: '#ffd700', 
          marginBottom: '0.5rem',
          fontSize: '1.2rem'
        }}>
          📐 Nozzle Geometry
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Cross-sectional area and radius variation
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
              yAxisId="left"
              stroke="#888"
              label={{ value: 'Area (cm²)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#888"
              label={{ value: 'Radius (cm)', angle: 90, position: 'insideRight', fill: '#888' }}
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
              yAxisId="left"
              type="monotone" 
              dataKey="area" 
              stroke="#ffd700" 
              strokeWidth={3}
              dot={false}
              name="Area (cm²)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="radius" 
              stroke="#ff00ff" 
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              name="Radius (cm)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
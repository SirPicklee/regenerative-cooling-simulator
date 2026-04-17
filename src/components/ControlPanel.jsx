import React from 'react';

/**
 * SIMULATION CONTROL PANEL
 */
export default function ControlPanel({ params, onParamsChange, onRunSimulation, isRunning }) {
  const handleChange = (param, value) => {
    onParamsChange({ ...params, [param]: parseFloat(value) });
  };

  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: '1.5rem', 
      borderRadius: '8px',
      border: '1px solid #333',
      marginBottom: '2rem'
    }}>
      <h3 style={{ 
        fontFamily: 'Orbitron', 
        color: '#00d9ff', 
        marginBottom: '1rem',
        fontSize: '1.2rem'
      }}>
        🎮 Simulation Parameters
      </h3>

      {/* MASS FLOW RATE */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
          fontFamily: 'monospace'
        }}>
          <span>🌊 Mass Flow Rate</span>
          <span style={{ color: '#00d9ff', fontWeight: 'bold' }}>{params.massFlowRate.toFixed(1)} kg/s</span>
        </label>
        <input
          type="range"
          min="10"
          max="30"
          step="0.5"
          value={params.massFlowRate}
          onChange={(e) => handleChange('massFlowRate', e.target.value)}
          disabled={isRunning}
          style={{ width: '100%', accentColor: '#00d9ff' }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#555',
          marginTop: '0.25rem'
        }}>
          <span>10 kg/s (Low cooling)</span>
          <span>30 kg/s (High cooling)</span>
        </div>
      </div>

      {/* CHAMBER PRESSURE */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
          fontFamily: 'monospace'
        }}>
          <span>💪 Chamber Pressure</span>
          <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>{params.chamberPressure.toFixed(0)} bar</span>
        </label>
        <input
          type="range"
          min="200"
          max="400"
          step="10"
          value={params.chamberPressure}
          onChange={(e) => handleChange('chamberPressure', e.target.value)}
          disabled={isRunning}
          style={{ width: '100%', accentColor: '#ff6b35' }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#555',
          marginTop: '0.25rem'
        }}>
          <span>200 bar (Low thrust)</span>
          <span>400 bar (High thrust)</span>
        </div>
      </div>

      {/* COOLANT INLET TEMP */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
          fontFamily: 'monospace'
        }}>
          <span>❄️ Coolant Inlet Temp</span>
          <span style={{ color: '#0088ff', fontWeight: 'bold' }}>
            {params.coolantInletTemp.toFixed(0)} K ({(params.coolantInletTemp - 273.15).toFixed(0)} °C)
          </span>
        </label>
        <input
          type="range"
          min="100"
          max="150"
          step="5"
          value={params.coolantInletTemp}
          onChange={(e) => handleChange('coolantInletTemp', e.target.value)}
          disabled={isRunning}
          style={{ width: '100%', accentColor: '#0088ff' }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#555',
          marginTop: '0.25rem'
        }}>
          <span>100 K (Very cold)</span>
          <span>150 K (Warmer)</span>
        </div>
      </div>

      {/* CHAMBER TEMPERATURE */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          color: '#888',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
          fontFamily: 'monospace'
        }}>
          <span>🔥 Chamber Temperature</span>
          <span style={{ color: '#ff0000', fontWeight: 'bold' }}>
            {params.chamberTemp.toFixed(0)} K ({(params.chamberTemp - 273.15).toFixed(0)} °C)
          </span>
        </label>
        <input
          type="range"
          min="3000"
          max="3700"
          step="50"
          value={params.chamberTemp}
          onChange={(e) => handleChange('chamberTemp', e.target.value)}
          disabled={isRunning}
          style={{ width: '100%', accentColor: '#ff0000' }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#555',
          marginTop: '0.25rem'
        }}>
          <span>3000 K (Lower combustion)</span>
          <span>3700 K (Hotter combustion)</span>
        </div>
      </div>

      {/* RUN BUTTON */}
      <button
        onClick={onRunSimulation}
        disabled={isRunning}
        style={{
          width: '100%',
          padding: '1rem',
          background: isRunning ? '#555' : 'linear-gradient(135deg, #ff6b35 0%, #ff8555 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontFamily: 'Orbitron',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          transition: 'all 0.3s ease',
          boxShadow: isRunning ? 'none' : '0 0 20px rgba(255, 107, 53, 0.3)'
        }}
      >
        {isRunning ? '⏳ Computing...' : '🚀 Run Simulation'}
      </button>
    </div>
  );
}
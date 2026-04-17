import React, { useState } from 'react';
import { ENGINE_PRESETS, PRESET_ORDER } from '../simulation/presets';

/**
 * ENGINE PRESET SELECTOR
 */
export default function PresetSelector({ onPresetSelect, currentParams }) {
  const [selectedPreset, setSelectedPreset] = useState('raptor');

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    const preset = ENGINE_PRESETS[presetKey];
    onPresetSelect(preset); // Send entire preset object, not just params
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
        color: '#ffd700', 
        marginBottom: '0.5rem',
        fontSize: '1.2rem'
      }}>
        🚀 Engine Presets
      </h3>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Load real rocket engine parameters instantly
      </p>

      {/* PRESET BUTTONS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {PRESET_ORDER.map(key => {
          const preset = ENGINE_PRESETS[key];
          const isSelected = selectedPreset === key;
          
          return (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              style={{
                padding: '1rem',
                background: isSelected 
                  ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                  : '#0a0a0a',
                border: isSelected ? 'none' : '1px solid #333',
                borderRadius: '8px',
                color: isSelected ? '#000' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                fontFamily: 'Space Mono, monospace'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.target.style.borderColor = '#ffd700';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.target.style.borderColor = '#333';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '1rem',
                marginBottom: '0.5rem',
                fontFamily: 'Orbitron'
              }}>
                {preset.name}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                opacity: isSelected ? 0.8 : 0.6,
                marginBottom: '0.5rem'
              }}>
                {preset.description}
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                opacity: isSelected ? 0.7 : 0.5,
                fontStyle: 'italic'
              }}>
                {preset.specs.company}
              </div>
            </button>
          );
        })}
      </div>

      {/* PRESET DETAILS */}
      {selectedPreset && (
        <div style={{
          background: '#0a0a0a',
          padding: '1rem',
          borderRadius: '4px',
          border: '1px solid #333'
        }}>
          <h4 style={{ 
            color: '#ffd700', 
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
            fontFamily: 'Orbitron'
          }}>
            📋 Specifications
          </h4>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.8rem',
            fontFamily: 'monospace'
          }}>
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Thrust</div>
              <div style={{ color: '#fff' }}>{ENGINE_PRESETS[selectedPreset].specs.thrust}</div>
            </div>
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Specific Impulse</div>
              <div style={{ color: '#fff' }}>{ENGINE_PRESETS[selectedPreset].specs.isp}</div>
            </div>
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Propellants</div>
              <div style={{ color: '#fff' }}>{ENGINE_PRESETS[selectedPreset].specs.propellants}</div>
            </div>
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Chamber Pressure</div>
              <div style={{ color: '#fff' }}>{ENGINE_PRESETS[selectedPreset].params.chamberPressure} bar</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar } from 'recharts';
import { CombustionAnalyzer, METHANE_COMBUSTION } from '../physics/chemicalKinetics';

/**
 * CHEMICAL KINETICS & COMBUSTION PANEL
 * Species concentration, reaction rates, combustion efficiency
 */
export default function ChemicalKineticsPanel({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults || !geometry) {
    return null;
  }

  // Assume stoichiometric O/F ratio for methane combustion
  const OF_stoich = METHANE_COMBUSTION.stoichiometricRatio; // 4.0
  const massFlowRate_total = simParams.massFlowRate;
  
  // Calculate fuel and oxidizer flow rates (assuming stoichiometric)
  const massFlowRate_fuel = massFlowRate_total / (1 + OF_stoich);
  const massFlowRate_oxidizer = massFlowRate_total - massFlowRate_fuel;
  
  // Create combustion analyzer
  const combustion = new CombustionAnalyzer({
    massFlowRate_fuel: massFlowRate_fuel,
    massFlowRate_oxidizer: massFlowRate_oxidizer,
    P_chamber: simParams.chamberPressure * 1e5, // Pa
    T_chamber: simParams.chamberTemp,
    T_injector: simParams.coolantInletTemp,
  });
  
  const results = combustion.getResults();
  
  // Species data for pie chart
  const speciesData = [
    { name: 'CO₂', value: results.species.X_CO2 * 100, fill: '#ff6b35' },
    { name: 'H₂O', value: results.species.X_H2O * 100, fill: '#0088ff' },
    { name: 'O₂', value: results.species.X_O2 * 100, fill: '#ffd700' },
    { name: 'CH₄', value: results.species.X_CH4 * 100, fill: '#00ff00' },
    { name: 'CO', value: results.species.X_CO * 100, fill: '#ff00ff' },
    { name: 'H₂', value: results.species.X_H2 * 100, fill: '#00d9ff' },
  ].filter(s => s.value > 0.1); // Only show species > 0.1%
  
  // Mixture type color
  const getMixtureColor = (type) => {
    switch(type) {
      case 'lean': return '#0088ff';
      case 'stoichiometric': return '#00ff00';
      case 'rich': return '#ff6b35';
      default: return '#888';
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff6b35', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🔥 Chemical Kinetics & Combustion
      </h2>

      <div className="content-grid">
        {/* MIXTURE RATIO */}
        <div className="panel">
          <h2>⚖️ Mixture Ratio</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>O/F Ratio</div>
              <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                {results.OF.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                kg O₂ / kg CH₄
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Equivalence Ratio (φ)</div>
              <div style={{ fontSize: '1.5rem', color: '#00d9ff' }}>
                {results.phi.toFixed(3)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {results.phi < 0.95 ? 'Lean (excess O₂)' : results.phi > 1.05 ? 'Rich (excess CH₄)' : 'Stoichiometric'}
              </div>
            </div>
            
            <div style={{ 
              padding: '0.75rem',
              background: getMixtureColor(results.mixtureType) + '20',
              borderRadius: '4px',
              border: `1px solid ${getMixtureColor(results.mixtureType)}`,
              fontSize: '0.75rem'
            }}>
              {results.mixtureType.toUpperCase()} MIXTURE
            </div>
          </div>
        </div>

        {/* FLAME TEMPERATURE */}
        <div className="panel">
          <h2>🔥 Flame Temperature</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Adiabatic Flame Temp</div>
              <div style={{ fontSize: '2rem', color: '#ff6b35', fontWeight: 'bold' }}>
                {results.T_adiabatic.toFixed(0)} K
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {(results.T_adiabatic - 273).toFixed(0)} °C
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Actual Chamber Temp</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {simParams.chamberTemp.toFixed(0)} K
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Combustion Efficiency</div>
              <div style={{ fontSize: '1.5rem', color: results.eta_combustion > 0.95 ? '#00ff00' : '#ffd700' }}>
                {(results.eta_combustion * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* HEAT RELEASE */}
        <div className="panel">
          <h2>💥 Heat Release</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Heat Release</div>
              <div style={{ fontSize: '2rem', color: '#ff0000', fontWeight: 'bold' }}>
                {(results.heatRelease / 1e6).toFixed(1)} MW
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Thermal power output
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Fuel Flow Rate</div>
              <div style={{ fontSize: '1.2rem', color: '#00ff00' }}>
                {massFlowRate_fuel.toFixed(2)} kg/s
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Oxidizer Flow Rate</div>
              <div style={{ fontSize: '1.2rem', color: '#0088ff' }}>
                {massFlowRate_oxidizer.toFixed(2)} kg/s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REACTION KINETICS */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>
        <div className="panel">
          <h2>⚗️ Reaction Rate</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Rate Constant (k)</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {results.reactionRate.k.toExponential(2)} s⁻¹
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Arrhenius: k = A·exp(-E_a/RT)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Reaction Rate</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.reactionRate.rate.toExponential(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                mol/(m³·s)
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Chemical Time Scale (τ_chem)</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(results.reactionRate.tau_chem * 1e6).toExponential(2)} μs
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>🧪 Mixture Properties</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Molecular Weight</div>
              <div style={{ fontSize: '1.5rem', color: '#ffd700' }}>
                {results.MW_mix.toFixed(2)} g/mol
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Specific Heat Ratio (γ)</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {results.gamma.toFixed(3)}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Gas Constant (R_mix)</div>
              <div style={{ fontSize: '1.2rem', color: '#00d9ff' }}>
                {(8314.46 / results.MW_mix).toFixed(1)} J/(kg·K)
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>📋 Stoichiometry</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                CH₄ + 2·O₂ → CO₂ + 2·H₂O
              </div>
            </div>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>Stoichiometric O/F:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>{OF_stoich.toFixed(2)}</span>
            </div>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#888' }}>Heat of Combustion:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>{(METHANE_COMBUSTION.heatOfCombustion / 1e6).toFixed(1)} MJ/kg</span>
            </div>
            
            <div>
              <span style={{ color: '#888' }}>Propellant:</span>
              <span style={{ color: '#fff', marginLeft: '1rem' }}>Methalox</span>
            </div>
          </div>
        </div>
      </div>

      {/* SPECIES COMPOSITION */}
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
          🧪 Species Composition
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Mole fractions of combustion products
        </p>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={speciesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {speciesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a1a1a', 
                    border: '1px solid #00d9ff',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#ff6b35', fontWeight: 'bold' }}>CO₂: {(results.species.X_CO2 * 100).toFixed(2)}%</div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>Carbon dioxide</div>
            </div>
            
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a1a1a', borderRadius: '4px' }}>
              <div style={{ color: '#0088ff', fontWeight: 'bold' }}>H₂O: {(results.species.X_H2O * 100).toFixed(2)}%</div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>Water vapor</div>
            </div>
            
            {results.species.X_O2 > 0.001 && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ color: '#ffd700', fontWeight: 'bold' }}>O₂: {(results.species.X_O2 * 100).toFixed(2)}%</div>
                <div style={{ color: '#666', fontSize: '0.75rem' }}>Excess oxygen</div>
              </div>
            )}
            
            {results.species.X_CH4 > 0.001 && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ color: '#00ff00', fontWeight: 'bold' }}>CH₄: {(results.species.X_CH4 * 100).toFixed(2)}%</div>
                <div style={{ color: '#666', fontSize: '0.75rem' }}>Unburned methane</div>
              </div>
            )}
            
            {results.species.X_CO > 0.001 && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ color: '#ff00ff', fontWeight: 'bold' }}>CO: {(results.species.X_CO * 100).toFixed(2)}%</div>
                <div style={{ color: '#666', fontSize: '0.75rem' }}>Carbon monoxide</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EFFICIENCY BAR */}
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
          📊 Combustion Efficiency
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          η_c = (T_actual - T_initial) / (T_adiabatic - T_initial)
        </p>
        
        <div style={{ 
          width: '100%', 
          height: '60px', 
          background: '#1a1a1a', 
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          border: '2px solid #333'
        }}>
          <div style={{ 
            width: `${results.eta_combustion * 100}%`, 
            height: '100%', 
            background: 'linear-gradient(90deg, #00ff00, #ffd700)',
            transition: 'width 0.5s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#000',
              textShadow: '0 0 10px rgba(255,255,255,0.5)'
            }}>
              {(results.eta_combustion * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#888'
        }}>
          <div>0% (No combustion)</div>
          <div>100% (Perfect adiabatic)</div>
        </div>
      </div>

      {/* CHEMICAL EQUATIONS */}
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
          ⚗️ Chemical Kinetics Equations
        </h3>
        
        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Arrhenius Rate Law:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              k = A · exp(-E_a / RT)
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Global Reaction Rate:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              r = k · [CH₄]^a · [O₂]^b
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Equivalence Ratio:
            </div>
            <div style={{ fontFamily: 'monospace', color: '#00d9ff' }}>
              φ = (F/O)_stoich / (F/O)_actual
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
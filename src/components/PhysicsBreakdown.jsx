import React from 'react';

/**
 * DETAILED PHYSICS BREAKDOWN
 * Shows dimensionless numbers and heat transfer coefficients
 */
export default function PhysicsBreakdown({ fullThermalResults, geometry, simParams }) {
  if (!fullThermalResults) {
    return null;
  }

  // Find throat position for critical analysis
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatIndex = fullThermalResults.axialPositions.findIndex(x => Math.abs(x - throatX) < 0.01);
  
  // Get properties at throat (most critical region)
  const throatHeatFlux = fullThermalResults.heatFlux[throatIndex];
  const throatWallTemp = fullThermalResults.wallTempHot[throatIndex];
  const throatCoolantTemp = fullThermalResults.coolantTemp[throatIndex];
  
  // Calculate dimensionless numbers at throat
  const D_h = 2 * 0.002 * 0.003 / (0.002 + 0.003); // Hydraulic diameter
  const velocity = simParams.massFlowRate / (430 * 0.002 * 0.003 * 360); // Approximate
  
  // Coolant properties at throat
  const coolantProps = {
    rho: 430, // kg/m³ (liquid CH4)
    mu: 1.2e-4, // Pa·s
    k: 0.18, // W/(m·K)
    cp: 3400, // J/(kg·K)
  };
  
  const Re = (coolantProps.rho * velocity * D_h) / coolantProps.mu;
  const Pr = (coolantProps.mu * coolantProps.cp) / coolantProps.k;
  const Nu = 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4);
  const h_coolant = (Nu * coolantProps.k) / D_h;
  
  // Gas side (simplified)
  const h_gas = 15000; // W/(m²·K) - typical for high-speed combustion
  
  // Overall heat transfer coefficient
  const k_wall = 320; // W/(m·K) - copper
  const t_wall = 0.001; // m
  const U = 1 / (1/h_gas + t_wall/k_wall + 1/h_coolant);
  
  // Thermal resistances
  const R_gas = 1 / h_gas;
  const R_wall = t_wall / k_wall;
  const R_coolant = 1 / h_coolant;
  const R_total = R_gas + R_wall + R_coolant;
  
  const R_gas_percent = (R_gas / R_total) * 100;
  const R_wall_percent = (R_wall / R_total) * 100;
  const R_coolant_percent = (R_coolant / R_total) * 100;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ffd700', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🔬 Advanced Physics Analysis
      </h2>
      
      <div className="content-grid">
        {/* DIMENSIONLESS NUMBERS */}
        <div className="panel">
          <h2>📐 Dimensionless Numbers</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#00d9ff', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Reynolds Number (Re)
              </div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                {Re.toExponential(2)}
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {Re > 10000 ? '✅ Highly turbulent flow' : Re > 2300 ? '⚠️ Turbulent flow' : '❌ Laminar flow'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Prandtl Number (Pr)
              </div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                {Pr.toFixed(2)}
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Momentum vs thermal diffusivity
              </div>
            </div>
            
            <div>
              <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Nusselt Number (Nu)
              </div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                {Nu.toFixed(1)}
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Convective vs conductive heat transfer
              </div>
            </div>
          </div>
        </div>

        {/* HEAT TRANSFER COEFFICIENTS */}
        <div className="panel">
          <h2>🔥 Heat Transfer Coefficients</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Gas Side (h_gas)
              </div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                {(h_gas / 1000).toFixed(1)} kW/(m²·K)
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                High-speed turbulent combustion
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#0088ff', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Coolant Side (h_coolant)
              </div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                {(h_coolant / 1000).toFixed(1)} kW/(m²·K)
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Turbulent liquid methane
              </div>
            </div>
            
            <div>
              <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                Overall (U)
              </div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                {(U / 1000).toFixed(1)} kW/(m²·K)
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Combined thermal resistance
              </div>
            </div>
          </div>
        </div>

        {/* THERMAL RESISTANCES */}
        <div className="panel">
          <h2>🛡️ Thermal Resistances</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#ff0000' }}>Gas Boundary Layer</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{R_gas_percent.toFixed(1)}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${R_gas_percent}%`, 
                  height: '100%', 
                  background: '#ff0000' 
                }}></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#ffa500' }}>Wall Conduction</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{R_wall_percent.toFixed(1)}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${R_wall_percent}%`, 
                  height: '100%', 
                  background: '#ffa500' 
                }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#0088ff' }}>Coolant Boundary Layer</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{R_coolant_percent.toFixed(1)}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${R_coolant_percent}%`, 
                  height: '100%', 
                  background: '#0088ff' 
                }}></div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '1rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #333',
              color: '#888',
              fontSize: '0.75rem'
            }}>
              ⚠️ Coolant side is the bottleneck ({R_coolant_percent.toFixed(0)}% resistance)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
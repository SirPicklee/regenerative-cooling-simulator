import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';

/**
 * MESH QUALITY VISUALIZATION
 */
export default function MeshQualityPanel({ mesh, geometry }) {
  if (!mesh) {
    return null;
  }

  const stats = mesh.getStatistics();
  
  // Analyze cell sizes along axial direction
  const axialDistribution = [];
  const uniqueX = [...new Set(mesh.nodes.map(n => n.x))].sort((a, b) => a - b);
  
  for (let i = 0; i < uniqueX.length - 1; i++) {
    const x = uniqueX[i];
    const dx = uniqueX[i + 1] - uniqueX[i];
    const section = geometry.getSection(x);
    
    axialDistribution.push({
      position: (x * 100).toFixed(1),
      cellSize: (dx * 1000).toFixed(2), // mm
      section: section,
    });
  }
  
  // Color cells by section
  const getSectionColor = (section) => {
    switch(section) {
      case 'chamber': return '#ff8800';
      case 'convergent': return '#ffaa00';
      case 'throat': return '#ff0000';
      case 'divergent': return '#0088ff';
      default: return '#888888';
    }
  };

  // Layer distribution
  const layerStats = {
    hotGas: mesh.nodes.filter(n => n.layer === 'hot_gas').length,
    wall: mesh.nodes.filter(n => n.layer === 'wall').length,
    coolant: mesh.nodes.filter(n => n.layer === 'coolant').length,
  };

  const layerData = [
    { name: 'Hot Gas Boundary', nodes: layerStats.hotGas, color: '#ff0000' },
    { name: 'Wall Layers', nodes: layerStats.wall, color: '#ffa500' },
    { name: 'Coolant Layers', nodes: layerStats.coolant, color: '#0088ff' },
  ];

  // Throat refinement analysis
  const throatX = geometry.L_chamber + geometry.L_convergent;
  const throatNodes = mesh.nodes.filter(n => Math.abs(n.x - throatX) < 0.05);
  const throatCellCount = throatNodes.length;
  const totalCells = mesh.cells.length;
  const throatPercentage = ((throatCellCount / mesh.totalNodes) * 100).toFixed(1);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        fontFamily: 'Orbitron', 
        color: '#ff00ff', 
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        🔲 Mesh Quality Analysis
      </h2>

      <div className="content-grid">
        {/* MESH STATISTICS */}
        <div className="panel">
          <h2>📊 Grid Statistics</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Total Nodes</div>
              <div style={{ fontSize: '2rem', color: '#00d9ff', fontWeight: 'bold' }}>
                {stats.totalNodes.toLocaleString()}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Grid Dimensions</div>
              <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                {stats.nx} × {stats.nr}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                (Axial × Radial)
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Cell Count</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {stats.totalCells.toLocaleString()}
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Aspect Ratio (max)</div>
              <div style={{ fontSize: '1.2rem', color: stats.aspectRatio_max > 10 ? '#ff0000' : '#00ff00' }}>
                {stats.aspectRatio_max.toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {stats.aspectRatio_max > 10 ? '⚠️ High aspect ratio' : '✅ Good quality'}
              </div>
            </div>
          </div>
        </div>

        {/* THROAT REFINEMENT */}
        <div className="panel">
          <h2>🎯 Throat Refinement</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Throat Region Nodes</div>
              <div style={{ fontSize: '2rem', color: '#ff0000', fontWeight: 'bold' }}>
                {throatCellCount}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                {throatPercentage}% of total mesh
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Min Cell Size</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(stats.dx_min * 1000).toFixed(2)} mm
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Max Cell Size</div>
              <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                {(stats.dx_max * 1000).toFixed(2)} mm
              </div>
            </div>
            
            <div>
              <div style={{ color: '#888', marginBottom: '0.25rem' }}>Refinement Factor</div>
              <div style={{ fontSize: '1.2rem', color: '#ffd700' }}>
                {(stats.dx_max / stats.dx_min).toFixed(1)}x
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                ✅ Adaptive meshing active
              </div>
            </div>
          </div>
        </div>

        {/* LAYER DISTRIBUTION */}
        <div className="panel">
          <h2>📚 Layer Distribution</h2>
          <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            {layerData.map((layer, idx) => (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ color: layer.color }}>{layer.name}</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{layer.nodes}</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  background: '#333', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${(layer.nodes / stats.totalNodes) * 100}%`, 
                    height: '100%', 
                    background: layer.color 
                  }}></div>
                </div>
                <div style={{ 
                  color: '#666', 
                  fontSize: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  {((layer.nodes / stats.totalNodes) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AXIAL CELL SIZE DISTRIBUTION */}
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
          📏 Axial Cell Size Distribution
        </h3>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Notice refinement at throat region (~65 cm)
        </p>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={axialDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="position" 
              stroke="#888"
              label={{ value: 'Axial Position (cm)', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              label={{ value: 'Cell Size (mm)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#1a1a1a', 
                border: '1px solid #ff00ff',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Bar dataKey="cellSize" name="Cell Size (mm)">
              {axialDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSectionColor(entry.section)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div style={{ 
          marginTop: '1rem',
          display: 'flex',
          gap: '1.5rem',
          fontSize: '0.75rem',
          color: '#888',
          justifyContent: 'center'
        }}>
          <div><span style={{ color: '#ff8800' }}>■</span> Chamber</div>
          <div><span style={{ color: '#ffaa00' }}>■</span> Convergent</div>
          <div><span style={{ color: '#ff0000' }}>■</span> Throat (Refined)</div>
          <div><span style={{ color: '#0088ff' }}>■</span> Divergent</div>
        </div>
      </div>
    </div>
  );
}
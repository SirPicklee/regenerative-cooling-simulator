import React, { useState, useEffect } from 'react';
import { CONSTANTS, UNITS, DIMENSIONLESS } from './physics/constants';
import { MATERIALS, MaterialHelpers } from './physics/materials';
import { EngineGeometry, CoolingChannelGeometry } from './simulation/geometry';
import { Mesh2D } from './simulation/mesh';
import { RegenerativeCoolingSolver } from './physics/thermal';
import HeatFluxChart from './components/HeatFluxChart';
import ControlPanel from './components/ControlPanel';
import PhysicsBreakdown from './components/PhysicsBreakdown';
import PresetSelector from './components/PresetSelector';
import AdvancedCharts from './components/AdvancedCharts';
import MeshQualityPanel from './components/MeshQualityPanel';
import ErrorAnalysisPanel from './components/ErrorAnalysisPanel';
import BoundaryLayerPanel from './components/BoundaryLayerPanel';
import RadiationPanel from './components/RadiationPanel';
import TurbulencePanel from './components/TurbulencePanel';
import StressPanel from './components/StressPanel';
import TransientPanel from './components/TransientPanel';
import CompressibleFlowPanel from './components/CompressibleFlowPanel';
import NozzlePerformancePanel from './components/NozzlePerformancePanel';
import ChemicalKineticsPanel from './components/ChemicalKineticsPanel';
import AcousticPanel from './components/AcousticPanel';
import FatiguePanel from './components/FatiguePanel';
import TwoPhaseFlowPanel from './components/TwoPhaseFlowPanel';
import InjectorPanel from './components/InjectorPanel';
import FilmCoolingPanel from './components/FilmCoolingPanel';
import ConjugateHeatTransferPanel from './components/ConjugateHeatTransferPanel';
import ErosionAblationPanel from './components/ErosionAblationPanel';
import ThrustVectorControlPanel from './components/ThrustVectorControlPanel';
import StructuralVibrationPanel from './components/StructuralVibrationPanel';
import NozzleOptimizationPanel from './components/NozzleOptimizationPanel';

function App() {
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [physicsTest, setPhysicsTest] = useState(null);
  const [geometryTest, setGeometryTest] = useState(null);
  const [meshTest, setMeshTest] = useState(null);
  const [thermalResults, setThermalResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [geometry, setGeometry] = useState(null);
  const [fullThermalResults, setFullThermalResults] = useState(null);
  const [meshData, setMeshData] = useState(null);
  
  const [simParams, setSimParams] = useState({
    massFlowRate: 18,
    chamberPressure: 300,
    coolantInletTemp: 111,
    chamberTemp: 3500
  });
  
  const [geometryParams, setGeometryParams] = useState({
    chamberDiameter: 0.30,
    throatDiameter: 0.15,
    exitDiameter: 0.50,
    chamberLength: 0.50,
    nozzleLength: 0.80,
  });

  // Initialize on mount
  useEffect(() => {
    const testPhysics = () => {
      const T_chamber = CONSTANTS.CHAMBER_TEMP;
      const T_coolant = 150;
      
      const gasProps = MaterialHelpers.getGasProperties(T_chamber, CONSTANTS.CHAMBER_PRESSURE);
      const coolantProps = MaterialHelpers.getCoolantProperties(T_coolant);
      const wallProps = MaterialHelpers.getWallProperties(400);
      
      const velocity = 10;
      const D_h = 2 * CONSTANTS.CHANNEL_WIDTH * CONSTANTS.CHANNEL_HEIGHT / 
                  (CONSTANTS.CHANNEL_WIDTH + CONSTANTS.CHANNEL_HEIGHT);
      const Re = DIMENSIONLESS.reynolds(
        coolantProps.rho, 
        velocity, 
        D_h, 
        coolantProps.mu
      );
      
      return {
        chamberTemp: UNITS.kelvinToCelsius(T_chamber),
        chamberPressure: UNITS.paToBar(CONSTANTS.CHAMBER_PRESSURE),
        gasProps,
        coolantProps,
        wallProps,
        reynoldsNumber: Re,
        channelCount: CONSTANTS.CHANNEL_COUNT,
      };
    };
    
    const testGeometry = () => {
      const geom = new EngineGeometry(geometryParams);
      setGeometry(geom);
      const summary = geom.getSummary();
      const x_throat = geom.L_chamber + geom.L_convergent;
      const R_throat = geom.getRadius(x_throat);
      const M_throat = geom.getMachNumber(x_throat);
      
      return {
        ...summary,
        throatRadius: R_throat,
        throatMach: M_throat,
        totalLength: geom.L_total,
      };
    };
    
    const testMesh = () => {
      const geom = new EngineGeometry(geometryParams);
      const mesh = new Mesh2D(geom);
      const stats = mesh.getStatistics();
      const throatNodes = mesh.getThroatNodes();
      
      return {
        ...stats,
        throatNodeCount: throatNodes.length,
      };
    };
    
    const physics = testPhysics();
    const geomTest = testGeometry();
    const mesh = testMesh();
    
    setPhysicsTest(physics);
    setGeometryTest(geomTest);
    setMeshTest(mesh);
    
    console.log('🔬 Physics Test:', physics);
    console.log('📐 Geometry Test:', geomTest);
    console.log('🔲 Mesh Test:', mesh);
  }, [geometryParams]);

  // RUN THERMAL SIMULATION
  const runSimulation = () => {
    setIsSimRunning(true);
    setProgress(0);
    
    console.log('🚀 Starting Thermal Simulation with params:', simParams);
    console.log('📐 Geometry params:', geometryParams);
    
    setTimeout(() => {
      try {
        const geom = new EngineGeometry(geometryParams);
        const mesh = new Mesh2D(geom);
        
        setProgress(30);
        setMeshData(mesh);
        setGeometry(geom);
        
        // Create solver WITH custom parameters
        const solver = new RegenerativeCoolingSolver(geom, mesh, simParams);
        
        setProgress(50);
        
        const results = solver.solve();
        const summary = solver.getSummary();
        
        setProgress(100);
        
        console.log('✅ Simulation Complete!', summary);
        setThermalResults(summary);
        setFullThermalResults(results);
        
      } catch (error) {
        console.error('❌ Simulation Error:', error);
      } finally {
        setIsSimRunning(false);
      }
    }, 100);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Regenerative Cooling Simulator</h1>
        <p>SpaceX Raptor-Style Thermal Analysis</p>
      </header>

      <main className="main-container">
        <div className="status-bar">
          <span className="status-indicator">
            {isSimRunning ? '🟢 Running' : '🔴 Idle'}
          </span>
          <button 
            className="btn-primary"
            onClick={runSimulation}
            disabled={isSimRunning}
          >
            {isSimRunning ? `Computing... ${progress}%` : 'Start Simulation'}
          </button>
        </div>

        {/* PRESET SELECTOR */}
        <PresetSelector
          onPresetSelect={(preset) => {
            setSimParams(preset.params);
            if (preset.geometry) {
              setGeometryParams(preset.geometry);
            }
          }}
          currentParams={simParams}
        />

        {/* CONTROL PANEL */}
        <ControlPanel
          params={simParams}
          onParamsChange={setSimParams}
          onRunSimulation={runSimulation}
          isRunning={isSimRunning}
        />

        <div className="content-grid">
          <div className="panel">
            <h2>🔬 Physics Engine</h2>
            {physicsTest && (
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                <p>✓ Constants loaded</p>
                <p>✓ Materials database active</p>
                <p>✓ Channel count: {physicsTest.channelCount}</p>
                <p>✓ Reynolds: {physicsTest.reynoldsNumber.toFixed(0)}</p>
              </div>
            )}
          </div>

          <div className="panel">
            <h2>📐 Geometry</h2>
            {geometryTest && (
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                <p>Expansion: {geometryTest.expansionRatio.toFixed(2)}:1</p>
                <p>Length: {(geometryTest.totalLength * 100).toFixed(0)} cm</p>
                <p>Throat R: {(geometryTest.throatRadius * 1000).toFixed(1)} mm</p>
                <p>Throat M: {geometryTest.throatMach.toFixed(2)}</p>
              </div>
            )}
          </div>

          <div className="panel">
            <h2>🔲 Mesh Grid</h2>
            {meshTest && (
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                <p>Nodes: {meshTest.totalNodes.toLocaleString()}</p>
                <p>Grid: {meshTest.nx} × {meshTest.nr}</p>
                <p>Cells: {meshTest.totalCells.toLocaleString()}</p>
                <p>Throat nodes: {meshTest.throatNodeCount}</p>
              </div>
            )}
          </div>
        </div>

        {/* THERMAL RESULTS */}
        {thermalResults && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ 
              fontFamily: 'Orbitron', 
              color: '#ff6b35', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              🔥 Thermal Analysis Results
            </h2>
            
            <div className="content-grid">
              <div className="panel">
                <h2>🌡️ Peak Heat Flux</h2>
                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  <p>Value: {thermalResults.peakHeatFlux.valueMW.toFixed(2)} MW/m²</p>
                  <p>Position: {(thermalResults.peakHeatFlux.position * 100).toFixed(1)} cm</p>
                  <p>Status: {thermalResults.peakHeatFlux.valueMW < 100 ? '✅ Safe' : '⚠️ Critical'}</p>
                </div>
              </div>

              <div className="panel">
                <h2>🔥 Max Wall Temp</h2>
                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  <p>Temp: {thermalResults.maxWallTemp.valueCelsius.toFixed(0)} °C</p>
                  <p>Position: {(thermalResults.maxWallTemp.position * 100).toFixed(1)} cm</p>
                  <p>Status: {thermalResults.maxWallTemp.valueCelsius < 800 ? '✅ Safe' : '⚠️ Hot'}</p>
                </div>
              </div>

              <div className="panel">
                <h2>❄️ Coolant Outlet</h2>
                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  <p>Temp: {thermalResults.coolantOutletTemp.valueCelsius.toFixed(0)} °C</p>
                  <p>Heat Load: {(thermalResults.totalHeatTransfer / 1e6).toFixed(2)} MW</p>
                  <p>Status: ✅ Operating</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEAT FLUX CHART */}
        {fullThermalResults && geometry && (
          <div style={{ marginTop: '2rem' }}>
            <HeatFluxChart 
              thermalResults={fullThermalResults} 
              geometry={geometry}
            />
          </div>
        )}
        
        {/* PHYSICS BREAKDOWN */}
        {fullThermalResults && geometry && (
          <PhysicsBreakdown 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* ADVANCED CHARTS */}
        {fullThermalResults && geometry && (
          <AdvancedCharts 
            thermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* MESH QUALITY */}
        {meshData && geometry && (
          <MeshQualityPanel 
            mesh={meshData}
            geometry={geometry}
          />
        )}

        {/* ERROR ANALYSIS */}
        {fullThermalResults && thermalResults && (
          <ErrorAnalysisPanel 
            fullThermalResults={fullThermalResults}
            simParams={simParams}
            thermalSummary={thermalResults}
          />
        )}

        {/* BOUNDARY LAYER ANALYSIS */}
        {fullThermalResults && geometry && (
          <BoundaryLayerPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* RADIATION ANALYSIS */}
        {fullThermalResults && geometry && (
          <RadiationPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* TURBULENCE MODELING */}
        {fullThermalResults && geometry && (
          <TurbulencePanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* STRESS ANALYSIS */}
        {fullThermalResults && geometry && (
          <StressPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* TRANSIENT ANALYSIS */}
        {fullThermalResults && geometry && (
          <TransientPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* COMPRESSIBLE FLOW ANALYSIS */}
        {fullThermalResults && geometry && (
          <CompressibleFlowPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* NOZZLE PERFORMANCE */}
        {fullThermalResults && geometry && (
          <NozzlePerformancePanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* CHEMICAL KINETICS */}
        {fullThermalResults && geometry && (
          <ChemicalKineticsPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* ACOUSTIC ANALYSIS */}
        {fullThermalResults && geometry && (
          <AcousticPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* FATIGUE & CREEP LIFE PREDICTION */}
        {fullThermalResults && geometry && (
          <FatiguePanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* TWO-PHASE FLOW ANALYSIS */}
        {fullThermalResults && geometry && (
          <TwoPhaseFlowPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* INJECTOR DESIGN & SPRAY ATOMIZATION */}
        {fullThermalResults && geometry && (
          <InjectorPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* FILM COOLING EFFECTIVENESS */}
        {fullThermalResults && geometry && (
          <FilmCoolingPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* CONJUGATE HEAT TRANSFER */}
        {fullThermalResults && geometry && (
          <ConjugateHeatTransferPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* EROSION & ABLATION ANALYSIS */}
        {fullThermalResults && geometry && (
          <ErosionAblationPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* THRUST VECTOR CONTROL */}
        {fullThermalResults && geometry && (
          <ThrustVectorControlPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* STRUCTURAL VIBRATION & MODAL ANALYSIS */}
        {fullThermalResults && geometry && (
          <StructuralVibrationPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}

        {/* NOZZLE SHAPE OPTIMIZATION */}
        {fullThermalResults && geometry && (
          <NozzleOptimizationPanel 
            fullThermalResults={fullThermalResults}
            geometry={geometry}
            simParams={simParams}
          />
        )}
      </main>
    </div>
  );
}

export default App;
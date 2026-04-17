/**
 * REAL ROCKET ENGINE PRESETS
 * Based on publicly available data
 */

export const ENGINE_PRESETS = {
  raptor: {
    name: "SpaceX Raptor 2",
    description: "Full-flow staged combustion, methalox",
    params: {
      massFlowRate: 18,
      chamberPressure: 300, // bar
      coolantInletTemp: 111, // K (-162°C)
      chamberTemp: 3600, // K
    },
    geometry: {
      chamberDiameter: 0.30,    // 300mm
      throatDiameter: 0.15,     // 150mm
      exitDiameter: 0.50,       // 500mm
      chamberLength: 0.50,
      nozzleLength: 0.80,
    },
    specs: {
      thrust: "230 tons (sea level)",
      isp: "327s (sea level) / 350s (vacuum)",
      propellants: "CH4 + LOX",
      company: "SpaceX"
    }
  },
  
  merlin: {
    name: "SpaceX Merlin 1D",
    description: "Gas-generator cycle, kerolox",
    params: {
      massFlowRate: 12,
      chamberPressure: 97, // bar (lower than Raptor)
      coolantInletTemp: 90, // K (RP-1 colder)
      chamberTemp: 3400, // K (kerosene burns cooler)
    },
    geometry: {
      chamberDiameter: 0.25,    // 250mm - SMALLER
      throatDiameter: 0.13,     // 130mm - SMALLER
      exitDiameter: 0.40,       // 400mm - SMALLER
      chamberLength: 0.45,
      nozzleLength: 0.70,
    },
    specs: {
      thrust: "90 tons (sea level)",
      isp: "282s (sea level) / 311s (vacuum)",
      propellants: "RP-1 + LOX",
      company: "SpaceX"
    }
  },
  
  rs25: {
    name: "Aerojet RS-25 (SSME)",
    description: "Staged combustion, hydrolox",
    params: {
      massFlowRate: 25,
      chamberPressure: 206, // bar
      coolantInletTemp: 20, // K (liquid hydrogen VERY cold)
      chamberTemp: 3300, // K (hydrogen burns clean but cooler)
    },
    geometry: {
      chamberDiameter: 0.35,    // 350mm - BIGGER
      throatDiameter: 0.18,     // 180mm - BIGGER
      exitDiameter: 0.65,       // 650mm - BIGGER
      chamberLength: 0.60,
      nozzleLength: 1.00,
    },
    specs: {
      thrust: "232 tons (sea level)",
      isp: "366s (sea level) / 452s (vacuum)",
      propellants: "LH2 + LOX",
      company: "NASA / Aerojet Rocketdyne"
    }
  },
  
  custom: {
    name: "Custom Configuration",
    description: "Manual parameter adjustment",
    params: {
      massFlowRate: 18,
      chamberPressure: 300,
      coolantInletTemp: 111,
      chamberTemp: 3500,
    },
    geometry: {
      chamberDiameter: 0.30,
      throatDiameter: 0.15,
      exitDiameter: 0.50,
      chamberLength: 0.50,
      nozzleLength: 0.80,
    },
    specs: {
      thrust: "Custom",
      isp: "Custom",
      propellants: "User-defined",
      company: "You"
    }
  }
};

export const PRESET_ORDER = ['raptor', 'merlin', 'rs25', 'custom'];

export default ENGINE_PRESETS;
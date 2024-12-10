import React, { createContext, useState, useContext, ReactNode } from "react";

// 定義類型
interface Place {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface MapContextType {
  selectedPlace: Place | null;
  setSelectedPlace: React.Dispatch<React.SetStateAction<Place | null>>;
}

// 創建 Context
const MapContext = createContext<MapContextType | undefined>(undefined);

// 創建 Provider
export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  return (
    <MapContext.Provider value={{ selectedPlace, setSelectedPlace }}>
      {children}
    </MapContext.Provider>
  );
};

// 自訂 Hook，方便使用 Context
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};

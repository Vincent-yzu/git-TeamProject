import React, { createContext, useState, useContext, ReactNode } from "react";

// 定義類型
interface Place {
  id: number;  // 0 = empty
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  icon: string;
}

// 定義變數類型
interface MapContextType {

  // 新增 selectedPlace
  selectedPlace: Place | null;
  setSelectedPlace: React.Dispatch<React.SetStateAction<Place | null>>;

  /// 新增 addedPlace
  addedPlace: Place | null;
  setAddedPlace: React.Dispatch<React.SetStateAction<Place | null>>;

  // 新增 zoomLevel
  zoomLevel: number;  
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;

  // 新增 heyUpdateData
  heyUpdateData: number;  
  setHeyUpdateData: React.Dispatch<React.SetStateAction<number>>;

  // 新增 selectedDayIndex
  selectedDayIndex: string;  
  setSelectedDayIndex: React.Dispatch<React.SetStateAction<string>>;
}

// 創建 Context、Provider
const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [addedPlace, setAddedPlace] = useState<Place | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(9);
  const [heyUpdateData, setHeyUpdateData] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState("0")

  return (
    <MapContext.Provider value={{ selectedPlace, setSelectedPlace, addedPlace, setAddedPlace, zoomLevel, setZoomLevel, heyUpdateData, setHeyUpdateData, selectedDayIndex, setSelectedDayIndex }}>
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

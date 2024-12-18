import { useEffect, useRef, useState } from "react"
import { Reorder } from "framer-motion"
import { Socket } from "socket.io-client"
import { useMapContext } from "./MapContext"; // 引入 Context

import { io } from "socket.io-client"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL


const initialMails: Mail[] = [
  {
    id: 1,
    name: "國立政治大學-校門口",
    type: "activity",
    order: 1,
    latitude: 25.017578,  // Example latitude (please adjust as needed)
    longitude: 121.565548, // Example longitude (please adjust as needed)
    location: "No. 64, Section 2, Zhinan Rd, Wenshan District, Taipei City, Taiwan 116",
    photoUrls: [],  // Add URLs if available
    description: "國立政治大學的校門口，讓你進入大學的核心區域。",
    recommendDuration: 60
  },
  {
    id: 2,
    name: "國立政治大學-大仁樓",
    type: "activity",
    order: 2,
    latitude: 25.017776,  // Example latitude (please adjust as needed)
    longitude: 121.564123, // Example longitude (please adjust as needed)
    location: "No. 64, Section 2, in National Chengchi University",
    photoUrls: [],  // Add URLs if available
    description: "大仁樓是國立政治大學的重要建築之一，擁有豐富的學術資源。",
    recommendDuration: 60
  },
]

// interface Mail {
//   id: number
//   name: string
//   dwell_time: string
//   formatted_address: string
//   icon: string
// }

interface Mail {
  id: number;
  name: string;
  type: string;
  order: number;
  latitude: number;
  longitude: number;
  location: string;
  photoUrls: string[];
  description: string;
  recommendDuration: number;
}


const ReorderMails = () => {
  const { heyUpdateData } = useMapContext(); // 從 Context 中取用 `heyUpdateData`
  const [mails, setMails] = useState<Mail[]>(initialMails)
  const containerRef = useRef<HTMLDivElement>(null)

  const socketRef = useRef<Socket | null>(null)
  const [roomId] = useState<string>("2123")

  // Fetch data from API manually
  const fetchData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/addactivity/select`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      const dayOneData = data.days.find((day: any) => day.day === 1);

      if (dayOneData && dayOneData.activities) {
        const updatedMails = dayOneData.activities
          .sort((a: any, b: any) => a.order - b.order) // 根據 order 排序
          .map((activity: any, index: number) => ({
            id: index,
            name: activity.name,
            type: activity.type,  // Presumed from the provided example
            order: activity.order,  // Assuming this is the first activity
            latitude: activity.latitude,  // Coordinates based on the given location
            longitude: activity.longitude, // Coordinates based on the given location
            location: activity.location,
            photoUrls: activity.photoUrls,
            description: activity.description,
            recommendDuration: activity.recommendDuration,
          }));

        setMails(updatedMails); // Update mails with new activities

        console.log(updatedMails);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Fetch data when component is mounted (once)
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array, so this effect only runs once on mount

  // Fetch data when in need
  useEffect(() => {
    fetchData();
  }, [heyUpdateData]);

  // New saveMails function to save current mails to the backend
  const saveMails = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/addactivity/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mails }), // Send the mails state
      });

      if (!response.ok) {
        throw new Error(`Failed to save mails: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Mails saved successfully:", data);
    } catch (error) {
      console.error("Error saving mails:", error);
    }
  };

  // Insert
  // useEffect(() => {
  //   if (addedPlace) {
  //     const updatedMails = [
  //       {
  //         id: addedPlace.id,
  //         name: `${addedPlace.name}`,
  //         dwell_time: `1小時 | 09:00 ~ 10:00`,
  //         formatted_address: `地址: ${addedPlace.formatted_address}`,
  //         icon: `${addedPlace.icon}`,
  //       },
  //       ...mails, // 將新資料添加到列表的開頭
  //     ];
  //     setMails(updatedMails);
  
  //     // 同步到伺服器
  //     socketRef.current?.emit("reorder_event", { roomId, reorderData: updatedMails });
  //   }
  // }, [addedPlace]);
  
  // Reorder
  useEffect(() => {
    const handleMouseUp = async (e: MouseEvent) => {
      if (
        containerRef.current &&
        containerRef.current.contains(e.target as Node)
      ) {
        console.log("Mouse released within child component:", mails)

        // 在使用者完成拖曳動作後，將更新後的資料送往伺服器
        socketRef.current?.emit("reorder_event", { roomId, reorderData: mails })

        // 呼叫 saveMails 函數，將更新的資料保存到後端
        await saveMails();
        console.log("Mails saved after reorder.");
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [mails, roomId])

  const socketClient = io(`${BACKEND_URL}/`, {
    withCredentials: true,
  })
  useEffect(() => {
    
    socketRef.current = socketClient
    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to socket server:", socket.id)
      // 當使用者進入 dashboard 時建立/加入房間
      socket.emit("create_room", roomId)
    })

    socket.on("room_created", (rid: string) => {
      console.log(`Joined room: ${rid}`)
    })

    // 接收來自伺服器的更新(若有其他使用者重整排序，就同步更新)
    socket.on("reorder_update", (updatedMails: Mail[]) => {
      console.log("Received reorder update:", updatedMails)
      setMails(updatedMails)
    })

    return () => {
      socket.disconnect()
    }
  }, [socketClient])

  // 使用者在前端拖曳重新排序後，只有更新 mails state，不立刻 emit
  const handleReorder = (newOrder: Mail[]) => {
    setMails(newOrder)
    // 不在這裡 emit，改由 handleMouseUp 完成最後的 emit
  }

  // 刪除行程
  const handleDeletePlace = async (name: string) => {
    const place = {
      place: { name }
    };

    // delete from DataBase
    const response = await fetch(`${BACKEND_URL}/api/addactivity/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(place),
    });
    if (!response.ok) {
      throw new Error('Failed to delete trip');
    }
    
    // 
    setMails((prevMails) => prevMails.filter(mail => mail.name !== name));
  };



  return (
    <div ref={containerRef}>
      <Reorder.Group axis="y" values={mails} onReorder={handleReorder}>
        {mails.map((mail) => (
          <Reorder.Item
            key={mail.id}
            value={mail}
            className="flex cursor-pointer flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {/* {mail.icon && (
              <img
                src={mail.icon}
                alt={mail.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            )} */}
            <div className="flex w-full items-center gap-2">
              <span>{mail.name}</span>
              <span className="ml-auto text-xs">{mail.recommendDuration} 分鐘</span>
            </div>
            <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
              {mail.location}
            </span>
            <button onClick={() => handleDeletePlace(mail.name)}>⮕ Delete!</button>
          </Reorder.Item>
        ))}

      <br/>
      <button onClick={() => fetchData()}>⮕⮕⮕ 重新整理!!!</button>
      </Reorder.Group>
    </div>
  )
}

export { ReorderMails }

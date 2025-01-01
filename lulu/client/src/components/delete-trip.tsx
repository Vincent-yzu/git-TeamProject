import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query"; 
import { useAuth } from "@/hooks/use-auth";
import { fetcher } from "@/lib/fetcher";
import { queryClient } from "@/lib/query-client";

interface DeleteTripModalProps {
  isOpen: boolean;
  itineraryId: string;
  onClose: () => void;
}

export const DeleteTripModal: FC<DeleteTripModalProps> = ({
  isOpen,
  itineraryId,
  onClose,
}) => {
  const { data: auth } = useAuth();
  const navigate = useNavigate();

  // 如果彈窗沒開啟就不渲染
  if (!isOpen) return null;

  // 使用 useMutation 來做「退出行程」的操作
  const deleteTripMutation = useMutation({
    // 定義要呼叫的函式
    mutationFn: async (id: string) => {
      const response = await fetcher("/api/addactivity/deleteEditor", {
        options: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itineraryId: id }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete trip: ${response.statusText}`);
      }
    },
    // 成功後要做的事
    onSuccess: () => {
      alert("退出行程成功！");
      onClose();           // 關閉彈窗
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    },
    // 失敗時要做的事
    onError: (error) => {
      console.error("Error deleting trip:", error);
      alert("退出行程時出現問題，請稍後再試！");
    },
  });

  // 點擊確定退出時，判斷是否有登入，若有則執行 mutation
  const handleDeleteTrip = () => {
    if (!auth?.user) {
      navigate("/sign-in");
      return;
    }
    deleteTripMutation.mutate(itineraryId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          className="close-button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "transparent",
            border: "none",
            color: "#333",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
        <h2 style={{ color: "#333", fontSize: "24px", marginBottom: "20px", fontWeight: "bold" }}>退出確認</h2>
        <p style={{ color: "#333", fontSize: "18px", marginBottom: "20px" }}>
          是否確定退出此行程？ 此操作無法復原喔！
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "15px",
          }}
        >
          <button
            className="cancel-button"
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              color: "#333",
              fontSize: "16px",
              cursor: "pointer",
              borderRadius: "5px",
              transition: "background-color 0.3s ease",
            }}
          >
            取消
          </button>
          <button
            className="confirm-delete-button"
            type="button"
            onClick={handleDeleteTrip}
            style={{
              marginTop: "16px",
              padding: "10px 20px",
              backgroundColor: "#ff4d4f",
              border: "1px solid #e60000",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
              borderRadius: "5px",
              transition: "background-color 0.3s ease",
            }}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
  
};

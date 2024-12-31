import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query"; 
import { useAuth } from "@/hooks/use-auth";
import { fetcher } from "@/lib/fetcher";

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
      window.location.reload();  // 重新整理頁面
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
          style={{ position: "absolute", top: "10px", right: "10px" }}
        >
          X
        </button>
        <h2>退出確認</h2>
        <p>是否確定退出此行程？此操作無法復原。</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button className="cancel-button" type="button" onClick={onClose}>
            取消
          </button>
          <button
            className="confirm-delete-button"
            type="button"
            onClick={handleDeleteTrip}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
};

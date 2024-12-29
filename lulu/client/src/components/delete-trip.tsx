import React, { FC } from "react";
import { useNavigate } from "react-router-dom"; // 引入 useNavigate
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

  // 檢查是否開啟彈窗
  if (!isOpen) return null;

  // 呼叫後端刪除 API
  const deleteTrip = async () => {
    if (!auth?.user) {
      navigate("/sign-in");
      return;
    }

    try {
      const response = await fetcher("/api/addactivity/deleteEditor", {
        options: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itineraryId }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete trip: ${response.statusText}`);
      }

      alert("行程刪除成功！");
      onClose(); // 關閉彈窗
      //navigate("/my-trip"); // 返回儀表板
      window.location.reload();  // 重新整理
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("刪除行程時出現問題，請稍後再試！");
    }
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
        <h2>確認刪除</h2>
        <p>是否確定刪除此行程？此操作無法復原。</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            className="cancel-button"
            type="button"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="confirm-delete-button"
            type="button"
            onClick={deleteTrip} // 確定刪除
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
};

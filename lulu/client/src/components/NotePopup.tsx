import React, { ChangeEvent } from "react"

interface NotePopupProps {
  noteValue: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onSave: () => void
  onCancel: () => void
}

const NotePopup: React.FC<NotePopupProps> = ({ noteValue, onChange, onSave, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-80">
        <h2 className="text-lg font-semibold mb-2">Edit Note</h2>
        <textarea
          value={noteValue}
          onChange={onChange}
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          rows={5}
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotePopup

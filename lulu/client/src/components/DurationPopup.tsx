import React, { useState } from "react"

interface DurationPopupProps {
  duration: number
  onDurationChange: (value: number) => void
  onSave: () => void
  onCancel: () => void
}
const DurationPopup: React.FC<DurationPopupProps> = ({

  duration,
  onDurationChange,
  onSave,
  onCancel,
}) => {
  const [hours, setHours] = useState(Math.floor(duration / 60))
  const [minutes, setMinutes] = useState(duration % 60)

  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = parseInt(e.target.value, 10)
    setHours(newHours)
    onDurationChange(newHours * 60 + minutes)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = parseInt(e.target.value, 10)
    setMinutes(newMinutes)
    onDurationChange(hours * 60 + newMinutes)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Edit Duration</h3>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">Duration</label>
          <div className="flex space-x-2">
            <select
              value={hours}
              onChange={handleHoursChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {[...Array(24).keys()].map((hour) => (
                <option key={hour} value={hour}>
                  {hour} hours
                </option>
              ))}
            </select>
            <select
              value={minutes}
              onChange={handleMinutesChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {[...Array(60).keys()].map((minute) => (
                <option key={minute} value={minute}>
                  {minute} minutes
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
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

export default DurationPopup

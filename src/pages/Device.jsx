import React, { useState, useEffect } from 'react'
import api from '../utils/api'

// Modal component for reusability
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const Device = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal states
  const [modalState, setModalState] = useState({
    add: false,
    edit: false,
    delete: false
  })
  
  // Form states
  const [formData, setFormData] = useState({
    model: '',
    status: 'active'
  })
  
  // Selected device for edit/delete
  const [selectedDevice, setSelectedDevice] = useState(null)

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/devices')
      setDevices(response.data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleAddDevice = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.post('/devices', formData)
      fetchDevices()
      closeAllModals()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDevice = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.put(`/devices/${selectedDevice.id}`, formData)
      fetchDevices()
      closeAllModals()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDevice = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.delete(`/devices/${selectedDevice.id}`)
      fetchDevices()
      closeAllModals()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setFormData({ model: '', status: 'active' })
    setModalState({ ...modalState, add: true })
  }

  const openEditModal = (device) => {
    setSelectedDevice(device)
    setFormData({ model: device.model, status: device.status })
    setModalState({ ...modalState, edit: true })
  }

  const openDeleteModal = (device) => {
    setSelectedDevice(device)
    setModalState({ ...modalState, delete: true })
  }

  const closeAllModals = () => {
    setModalState({ add: false, edit: false, delete: false })
    setSelectedDevice(null)
    setFormData({ model: '', status: 'active' })
  }

  const filteredDevices = devices.filter(device =>
    device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Device Management</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Device
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by model or ID..."
          className="w-full px-4 py-2 border rounded"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left">Device ID</th>
                <th className="px-6 py-3 text-left">Model</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Assignment</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr key={device.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono">{device.id}</td>
                  <td className="px-6 py-4">{device.model}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      device.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      device.is_assigned
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {device.is_assigned ? 'Assigned' : 'Not Assigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEditModal(device)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(device)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDevices.length === 0 && (
            <div className="text-center py-8">No devices found</div>
          )}
        </div>
      )}

      {/* Add Device Modal */}
      <Modal isOpen={modalState.add} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Add New Device</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter device model"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={closeAllModals}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDevice}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Device
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Device Modal */}
      <Modal isOpen={modalState.edit} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Edit Device</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter device model"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={closeAllModals}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateDevice}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update Device
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modalState.delete} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Delete Device</h2>
        <p className="mb-6">
          Are you sure you want to delete device {selectedDevice?.model} ({selectedDevice?.id})?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={closeAllModals}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteDevice}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Device

import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

const LocationSearch = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  const searchLocation = async (query) => {
    if (!query) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (err) {
      console.error('Search error:', err)
    }
    setLoading(false)
  }

  const handleSelect = (result) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    })
    setSearchResults([])
    setSearchQuery('')
  }

  return (
    <div className="absolute top-2 left-2 right-2 z-[1000]">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (e.target.value) {
              searchLocation(e.target.value)
            }
          }}
          placeholder="Search location..."
          className="w-full px-4 py-2 border rounded shadow-sm"
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const LocationPicker = ({ position, onLocationPick }) => {
  const map = useMapEvents({
    click(e) {
      onLocationPick(e.latlng)
    },
  })

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom())
    }
  }, [position, map])

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          onLocationPick(position)
        },
      }}
    />
  ) : null
}

const MapPreview = ({ lat, long, onLocationPick = null }) => {
  const position = [lat || 20.5937, long || 78.9629] // Default to India's center if no coords
  const [map, setMap] = useState(null)

  return (
    <div className="relative w-full h-[400px] bg-gray-100 rounded overflow-hidden">
      {onLocationPick && (
        <LocationSearch
          onLocationSelect={(latlng) => {
            onLocationPick(latlng)
            map?.setView([latlng.lat, latlng.lng], 16)
          }}
        />
      )}
      <MapContainer
        center={position}
        zoom={onLocationPick ? 5 : 13}
        className="h-full w-full"
        scrollWheelZoom={true}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onLocationPick ? (
          <LocationPicker position={lat && long ? position : null} onLocationPick={onLocationPick} />
        ) : (
          <Marker position={position} />
        )}
      </MapContainer>
      {onLocationPick && (
        <div className="absolute bottom-2 left-2 right-2 bg-white p-2 rounded shadow text-sm text-center">
          Search for a location, click on the map, or drag the marker to set location
        </div>
      )}
    </div>
  );
};

const Water = () => {
  const [waterSources, setWaterSources] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [modalState, setModalState] = useState({
    add: false,
    assign: false,
    delete: false,
    viewLocation: false,
    deviceInfo: false
  })
  const [assignedDevice, setAssignedDevice] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    location: {
      lat: '',
      long: ''
    }
  })

  const [selectedWaterSource, setSelectedWaterSource] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState('')

  const fetchWaterSources = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/water-sources')
      setWaterSources(response.data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnassignedDevices = async () => {
    try {
      const response = await api.get('/devices')
      setDevices(response.data.data.filter(device => !device.is_assigned) || [])
    } catch (err) {
      console.error('Error fetching devices:', err)
    }
  }

  useEffect(() => {
    fetchWaterSources()
    fetchUnassignedDevices()
  }, [])

  const handleAddWaterSource = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.post('/water-sources', formData)
      fetchWaterSources()
      closeAllModals()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignDevice = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.post('/water-sources/assign', {
        waterSourceId: selectedWaterSource.id,
        deviceId: selectedDevice
      })
      fetchWaterSources()
      fetchUnassignedDevices()
      closeAllModals()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWaterSource = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.delete(`/water-sources/${selectedWaterSource.id}`)
      fetchWaterSources()
      closeAllModals()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setFormData({ name: '', location: { lat: '', long: '' } })
    setModalState({ ...modalState, add: true })
  }

  const openAssignModal = (waterSource) => {
    setSelectedWaterSource(waterSource)
    setSelectedDevice('')
    setModalState({ ...modalState, assign: true })
  }

  const openDeleteModal = (waterSource) => {
    setSelectedWaterSource(waterSource)
    setModalState({ ...modalState, delete: true })
  }

  const openLocationModal = (waterSource) => {
    setSelectedWaterSource(waterSource)
    setModalState({ ...modalState, viewLocation: true })
  }

  const openDeviceInfoModal = async (deviceId) => {
    try {
      // First get the device details
      const deviceResponse = await api.get(`/devices/${deviceId}`)
      const device = deviceResponse.data.data

      // Then get the logs using the log_id
      const logResponse = await api.get(`/logs/${device.log_id}`)
      const logData = logResponse.data.data

      setAssignedDevice({
        ...device,
        waterQuality: {
          tds: logData.tds,
          temperature: logData.temperature,
          color: logData.color,
          turbidity: logData.turbidity
        }
      })
      setModalState({ ...modalState, deviceInfo: true })
    } catch (err) {
      setError(err.message)
    }
  }
  useEffect(() => {
    let interval;

    if (modalState.deviceInfo && assignedDevice?.log_id) {
      interval = setInterval(async () => {
        try {
          const logResponse = await api.get(`/logs/${assignedDevice.log_id}`);
          const logData = logResponse.data.data;

          setAssignedDevice(prev => ({
            ...prev,
            waterQuality: {
              tds: logData.tds,
              temperature: logData.temperature,
              color: logData.color,
              turbidity: logData.turbidity
            }
          }));
        } catch (err) {
          console.log(err);
        }
      }, 5000); // every 5 seconds
    }

    return () => clearInterval(interval);
  }, [modalState.deviceInfo, assignedDevice?.log_id]);


  const closeAllModals = () => {
    setModalState({
      add: false,
      assign: false,
      delete: false,
      viewLocation: false
    })
    setSelectedWaterSource(null)
    setSelectedDevice('')
    setFormData({ name: '', location: { lat: '', long: '' } })
  }

  const filteredWaterSources = waterSources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Water Source Management</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Water Source
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or ID..."
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
                <th className="px-6 py-3 text-left">Source ID</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Device Status</th>
                <th className="px-6 py-3 text-left">Location</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWaterSources.map((source) => (
                <tr key={source.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono">{source.id}</td>
                  <td className="px-6 py-4">{source.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {source.device_id ? (
                        <>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            Device Assigned
                          </span>
                          <button
                            onClick={() => openDeviceInfoModal(source.device_id)}
                            className="p-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                            title="View Device Info"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          No Device
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openLocationModal(source)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View Location
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {!source.device_id && (
                      <button
                        onClick={() => openAssignModal(source)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        Assign Device
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal(source)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredWaterSources.length === 0 && (
            <div className="text-center py-8">No water sources found</div>
          )}
        </div>
      )}

      {/* Add Water Source Modal */}
      <Modal isOpen={modalState.add} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Add Water Source</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter water source name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Location
            </label>
            <MapPreview
              lat={formData.location.lat}
              long={formData.location.long}
              onLocationPick={(latlng) => {
                setFormData({
                  ...formData,
                  location: {
                    lat: latlng.lat,
                    long: latlng.lng
                  }
                })
              }}
            />
          </div>
          {formData.location.lat && formData.location.long && (
            <div className="text-sm text-gray-600">
              Selected: {formData.location.lat.toFixed(6)}, {formData.location.long.toFixed(6)}
            </div>
          )}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={closeAllModals}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddWaterSource}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Water Source
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Device Modal */}
      <Modal isOpen={modalState.assign} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Assign Device</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Device
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select a device...</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.model} ({device.id})
                </option>
              ))}
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
              onClick={handleAssignDevice}
              disabled={!selectedDevice}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              Assign Device
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modalState.delete} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Delete Water Source</h2>
        <p className="mb-6">
          Are you sure you want to delete water source {selectedWaterSource?.name}?
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
            onClick={handleDeleteWaterSource}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* View Location Modal */}
      <Modal isOpen={modalState.viewLocation} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Location Details</h2>
        <div className="space-y-4">
          <div className="mb-4">
            <p><strong>Latitude:</strong> {selectedWaterSource?.location.lat}</p>
            <p><strong>Longitude:</strong> {selectedWaterSource?.location.long}</p>
          </div>
          <MapPreview
            lat={selectedWaterSource?.location.lat}
            long={selectedWaterSource?.location.long}
            onLocationPick={async (latlng) => {
              try {
                await api.put(`/water-sources/${selectedWaterSource.id}`, {
                  ...selectedWaterSource,
                  location: {
                    lat: latlng.lat,
                    long: latlng.lng
                  }
                });
                fetchWaterSources();
                setSelectedWaterSource({
                  ...selectedWaterSource,
                  location: {
                    lat: latlng.lat,
                    long: latlng.lng
                  }
                });
              } catch (err) {
                setError(err.message);
              }
            }}
          />
          <div className="flex justify-between mt-4">
            <p className="text-sm text-gray-600">
              You can search, click, or drag the marker to update the location
            </p>
            <button
              onClick={closeAllModals}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Device Info Modal */}
      <Modal isOpen={modalState.deviceInfo} onClose={closeAllModals}>
        <h2 className="text-xl font-bold mb-4">Water Quality Dashboard</h2>
        {assignedDevice && (
          <div className="space-y-6">
            {/* Device Information */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Device Information</h3>
              <div className="space-y-2">
                <p><strong>Device ID:</strong> <span className="font-mono">{assignedDevice.id}</span></p>
                <p><strong>Model:</strong> {assignedDevice.model}</p>
                <p><strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${assignedDevice.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {assignedDevice.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Water Quality Parameters */}
            {assignedDevice.waterQuality && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Water Quality Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TDS Meter */}
                  <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
                    <h4 className="text-lg font-medium mb-2">TDS Level</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-blue-600">
                        {assignedDevice.waterQuality.tds}
                        <span className="text-sm text-blue-400 ml-1">mg/L</span>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-blue-200 flex items-center justify-center">
                        <div
                          className={`text-sm font-medium ${assignedDevice.waterQuality.tds < 300 ? 'text-green-600' :
                              assignedDevice.waterQuality.tds < 600 ? 'text-yellow-600' : 'text-red-600'
                            }`}
                        >
                          {assignedDevice.waterQuality.tds < 300 ? 'Good' :
                            assignedDevice.waterQuality.tds < 600 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Temperature Gauge */}
                  <div className="p-4 bg-orange-50 rounded-lg shadow-sm">
                    <h4 className="text-lg font-medium mb-2">Temperature</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-orange-600">
                        {assignedDevice.waterQuality.temperature}
                        <span className="text-sm text-orange-400 ml-1">°C</span>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-orange-200 flex items-center justify-center">
                        <div
                          className={`text-sm font-medium ${assignedDevice.waterQuality.temperature > 35 ? 'text-red-600' :
                              assignedDevice.waterQuality.temperature < 15 ? 'text-blue-600' : 'text-green-600'
                            }`}
                        >
                          {assignedDevice.waterQuality.temperature > 35 ? 'Hot' :
                            assignedDevice.waterQuality.temperature < 15 ? 'Cold' : 'Normal'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Indicator */}
                  <div className="p-4 bg-purple-50 rounded-lg shadow-sm">
                    <h4 className="text-lg font-medium mb-2">Water Color</h4>
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: assignedDevice.waterQuality.color }}
                      ></div>
                      <div className="text-lg">
                        <span className="font-medium">Color Code: </span>
                        {assignedDevice.waterQuality.color}
                      </div>
                    </div>
                  </div>

                  {/* Turbidity */}
                  <div className="p-4 bg-teal-50 rounded-lg shadow-sm">
                    <h4 className="text-lg font-medium mb-2">Turbidity</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-teal-600">
                        {assignedDevice.waterQuality.turbidity}
                        <span className="text-sm text-teal-400 ml-1">NTU</span>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-teal-200 flex items-center justify-center">
                        <div
                          className={`text-sm font-medium ${assignedDevice.waterQuality.turbidity < 5 ? 'text-green-600' :
                              assignedDevice.waterQuality.turbidity < 10 ? 'text-yellow-600' : 'text-red-600'
                            }`}
                        >
                          {assignedDevice.waterQuality.turbidity < 5 ? 'Clear' :
                            assignedDevice.waterQuality.turbidity < 10 ? 'Cloudy' : 'Murky'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={closeAllModals}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Water

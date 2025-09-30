import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Custom icons for different markers
const waterSourceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const Dashboard = () => {
  const [waterSources, setWaterSources] = useState([])
  const [patientLogs, setPatientLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [center, setCenter] = useState([20.5937, 78.9629]) // Default center (India)
  const [circleCenter, setCircleCenter] = useState(null)
  const [showAlert, setShowAlert] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch water sources and patient logs in parallel
      const [waterSourcesRes, patientLogsRes] = await Promise.all([
        api.get('/water-sources'),
        api.get('/patient-logs')
      ])

      setWaterSources(waterSourcesRes.data.data || [])
      setPatientLogs(patientLogsRes.data || [])

      // Calculate center point if we have locations
      if (waterSourcesRes.data.data?.length || patientLogsRes.data?.length) {
        const allLocations = [
          ...(waterSourcesRes.data.data || []).map(s => [s.location.lat, s.location.long]),
          ...(patientLogsRes.data || []).map(p => [p.location.lat, p.location.long])
        ]

        if (allLocations.length > 0) {
          // Calculate average of all points for circle center
          const centerLat = allLocations.reduce((sum, loc) => sum + loc[0], 0) / allLocations.length
          const centerLong = allLocations.reduce((sum, loc) => sum + loc[1], 0) / allLocations.length
          setCenter([centerLat, centerLong])
          setCircleCenter([centerLat, centerLong])

          // Show alert if there are patient logs
          if (patientLogsRes.data?.length > 0) {
            setShowAlert(true)
          }
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate circle radius to encompass all points (in meters)
  const calculateCircleRadius = () => {
    if (!circleCenter || (!waterSources.length && !patientLogs.length)) return 1000

    const allPoints = [
      ...waterSources.map(s => [s.location.lat, s.location.long]),
      ...patientLogs.map(p => [p.location.lat, p.location.long])
    ]

    // Find the maximum distance from center to any point
    const maxDistance = Math.max(...allPoints.map(point => {
      return L.latLng(circleCenter).distanceTo(L.latLng(point))
    }))

    // Add 20% padding to the radius
    return maxDistance * 1.2
  }

  const countSymptoms = (logs) => {
    const symptoms = {}
    logs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptoms[symptom] = (symptoms[symptom] || 0) + 1
      })
    })
    return symptoms
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Water Source Dashboard</h1>
        {showAlert && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold">Health Alert</p>
                <p>Water-borne disease cases detected in this area!</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 mb-4 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Water Sources</h3>
            <p className="text-3xl font-bold text-blue-600">{waterSources.length}</p>
          </div>

          {/* <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Patient Cases</h3>
            <p className="text-3xl font-bold text-red-600">{patientLogs.length}</p>
          </div> */}

          {patientLogs.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Common Symptoms</h3>
              <div className="space-y-2">
                {Object.entries(countSymptoms(patientLogs)).map(([symptom, count]) => (
                  <div key={symptom} className="flex justify-between items-center">
                    <span>{symptom}</span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {count} cases
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="col-span-1 md:col-span-3">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="h-[600px] rounded overflow-hidden">
              <MapContainer
                center={center}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Water Source Markers */}
                {waterSources.map((source) => (
                  <Marker
                    key={source.id}
                    position={[source.location.lat, source.location.long]}
                    icon={waterSourceIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{source.name}</h3>
                        <p className="text-sm text-gray-600">Water Source</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Patient Location Markers */}
                {patientLogs.map((log) => (
                  <Marker
                    key={log.id}
                    position={[log.location.lat, log.location.long]}
                    icon={patientIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">Patient Case</h3>
                        <p className="text-sm text-gray-600">
                          Symptoms: {log.symptoms.join(", ")}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Circular Area */}
                {circleCenter && (
                  <Circle
                    center={circleCenter}
                    radius={calculateCircleRadius()}
                    pathOptions={{
                      color: showAlert ? 'red' : 'blue',
                      fillColor: showAlert ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 0, 255, 0.1)',
                      fillOpacity: 0.3
                    }}
                  />
                )}
              </MapContainer>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span>Water Sources</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span>Patient Cases</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

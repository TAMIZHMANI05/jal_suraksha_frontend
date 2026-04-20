import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { FiActivity, FiDroplet, FiThermometer, FiWind } from 'react-icons/fi';

const Analytics = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      const allDevices = response.data.data || [];
      setDevices(allDevices);
      if (allDevices.length > 0) {
        setSelectedDevice(allDevices[0].id);
      }
    } catch (err) {
      setError('Failed to fetch devices');
    }
  };

  useEffect(() => {
    if (selectedDevice) {
      fetchLogs(selectedDevice);
    }
  }, [selectedDevice]);

  const fetchLogs = async (deviceId) => {
    try {
      setLoading(true);
      const response = await api.get(`/logs/device/${deviceId}`);
      // Recharts expects data in chronological order (oldest first)
      const historicalData = (response.data.logs || []).reverse().map(log => ({
        ...log,
        time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(log.createdAt).toLocaleDateString()
      }));
      setLogs(historicalData);
    } catch (err) {
      setError('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 border border-blue-100 rounded-lg shadow-xl">
          <p className="text-sm font-bold text-gray-600 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-semibold">{entry.name}:</span> {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            Water Quality Analytics
          </h1>
          <p className="text-gray-500 mt-1">Deep insights into water health trends across your sources.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-gray-600 ml-2">Select Device:</span>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-blue-600 font-semibold cursor-pointer"
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.model} ({device.id.substring(0, 8)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <FiActivity />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <FiDroplet className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500">No telemetry data available for this device yet.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          {/* Main TDS Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FiDroplet size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">TDS Trend Analysis</h3>
                  <p className="text-sm text-gray-500">Total Dissolved Solids (mg/L)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{logs[logs.length-1].tds}</p>
                <p className="text-xs text-gray-400">Latest Reading</p>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={logs}>
                  <defs>
                    <linearGradient id="colorTds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="tds" name="TDS" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTds)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Temperature Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <FiThermometer size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Temperature Variation</h3>
                  <p className="text-xs text-gray-500">Fluctuations in °C</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" hide />
                    <YAxis axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="temperature" name="Temp" stroke="#f97316" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Turbidity Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                  <FiWind size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Turbidity Levels</h3>
                  <p className="text-xs text-gray-500">Water Clarity (NTU)</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" hide />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="turbidity" name="Turbidity" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

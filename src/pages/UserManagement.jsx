import React, { useState, useEffect } from 'react'
import api from "../utils/api";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="mb-6">{message}</p>
      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-white rounded ${confirmColor}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

const DocumentModal = ({ isOpen, onClose, url, user, onApprove, onReject, showActions }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Details</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <span className="text-2xl">&times;</span>
        </button>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">User Information</h3>
        <p><strong>Name:</strong> {user?.fullname}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Phone:</strong> {user?.phone_number}</p>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Document Preview</h3>
        <iframe
          src={url}
          className="w-full h-[60vh] border rounded"
          title="Document Preview"
        />
      </div>
      {showActions && (
        <div className="flex justify-end gap-4">
          <button
            onClick={onReject}
            className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded"
          >
            Approve
          </button>
        </div>
      )}
    </Modal>
  );
};

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('pending')
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState({ pending: 0, approved: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalState, setModalState] = useState({
    document: false,
    approve: false,
    reject: false,
    delete: false
  })

  const fetchUsers = async (type) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/users/${type}`)
      setUsers(response.data.data || [])  // Ensure users is always an array
      setTotalCount(prev => ({
        ...prev,
        [type]: response.data.count || 0  // Ensure count is always a number
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(activeTab)
  }, [activeTab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const closeAllModals = () => {
    setModalState({
      document: false,
      approve: false,
      reject: false,
      delete: false
    });
    setSelectedUser(null);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setModalState(prev => ({ ...prev, document: true }));
  }

  const handleApproveClick = (user) => {
    if (modalState.document) {
      setModalState(prev => ({ ...prev, approve: true }));
    } else {
      setSelectedUser(user);
      setModalState(prev => ({ ...prev, approve: true }));
    }
  }

  const handleRejectClick = (user) => {
    if (modalState.document) {
      setModalState(prev => ({ ...prev, reject: true }));
    } else {
      setSelectedUser(user);
      setModalState(prev => ({ ...prev, reject: true }));
    }
  }

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setModalState(prev => ({ ...prev, delete: true }));
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      await api.get(`/users/${selectedUser.id}/approve`)
      closeAllModals();
      fetchUsers(activeTab)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)
      await api.get(`/users/${selectedUser.id}/reject`)
      closeAllModals();
      fetchUsers(activeTab)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await api.delete(`/users/${selectedUser.id}`)
      closeAllModals();
      fetchUsers(activeTab)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div>
          <span className="mr-4">Total Pending: {totalCount.pending}</span>
          <span>Total Approved: {totalCount.approved}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex mb-4">
          <button
            className={`px-4 py-2 mr-2 ${
              activeTab === 'pending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
            onClick={() => handleTabChange('pending')}
          >
            Pending Approvals
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === 'approved'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
            onClick={() => handleTabChange('approved')}
          >
            Approved Users
          </button>
        </div>
        <input
          type="text"
          placeholder="Search by email or name..."
          className="w-full px-4 py-2 border rounded"
          value={searchQuery}
          onChange={handleSearch}
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
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">User Type</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-6 py-4">{user.fullname}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.phone_number}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      {user.role === 2 ? 'User' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      View Details
                    </button>
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveClick(user)}
                          className="text-green-500 hover:text-green-700 mr-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(user)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">No users found</div>
          )}
        </div>
      )}

      {/* Document Modal */}
      <DocumentModal
        isOpen={modalState.document}
        onClose={closeAllModals}
        url={selectedUser?.document_url}
        user={selectedUser}
        showActions={activeTab === 'pending'}
        onApprove={() => handleApproveClick(selectedUser)}
        onReject={() => handleRejectClick(selectedUser)}
      />

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.approve}
        onClose={closeAllModals}
        onConfirm={handleApprove}
        title="Confirm Approval"
        message={`Are you sure you want to approve ${selectedUser?.fullname}?`}
        confirmText="Approve"
        confirmColor="bg-green-500 hover:bg-green-600"
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.reject}
        onClose={closeAllModals}
        onConfirm={handleReject}
        title="Confirm Rejection"
        message={`Are you sure you want to reject ${selectedUser?.fullname}?`}
        confirmText="Reject"
        confirmColor="bg-red-500 hover:bg-red-600"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.delete}
        onClose={closeAllModals}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${selectedUser?.fullname}?`}
        confirmText="Delete"
        confirmColor="bg-red-500 hover:bg-red-600"
      />
    </div>
  )
}

export default UserManagement
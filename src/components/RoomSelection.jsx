import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ROOMS, CREATE_ROOM } from '../services/graphqlQueries';

const RoomSelection = ({ currentUser, onRoomSelected, onLogout }) => {
  const { data: roomsData, loading, refetch } = useQuery(GET_ROOMS);
  const [createRoom] = useMutation(CREATE_ROOM);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await createRoom({ variables: { name: newRoomName } });
      setNewRoomName('');
      setShowAddForm(false);
      refetch();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleNext = () => {
    const room = roomsData?.rooms?.find(r => r.id === selectedRoomId);
    if (room) {
      onRoomSelected(room);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Select Room</h1>
          <p className="text-gray-600">Welcome, {currentUser?.displayName || currentUser?.username}</p>
        </div>

        <div className="space-y-6">
          {/* Room Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Room
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Choose a room...</option>
              {roomsData?.rooms?.map(room => (
                <option key={room.id} value={room.id}>
                  #{room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Room Section */}
          <div className="border-t border-gray-200 pt-6">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add New Room</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Room name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddRoom}
                    disabled={!newRoomName.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Add Room
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onLogout}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
            >
              Logout
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedRoomId}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSelection;

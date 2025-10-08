import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ROOMS, CREATE_ROOM } from "../services/graphqlQueries";
import { FaPlus, FaSignOutAlt, FaArrowRight } from "react-icons/fa";

const RoomSelection = ({ currentUser, onRoomSelected, onLogout }) => {
  const { data: roomsData, loading, refetch } = useQuery(GET_ROOMS);
  const [createRoom] = useMutation(CREATE_ROOM);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await createRoom({ variables: { name: newRoomName } });
      setNewRoomName("");
      setShowAddForm(false);
      refetch();
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleNext = () => {
    const room = roomsData?.rooms?.find((r) => r.id === selectedRoomId);
    if (room) {
      onRoomSelected(room);
    }
  };

  if (loading)
    return (
      <div className="room-page-container">
        <p>Loading rooms...</p>
      </div>
    );

  return (
    <div className="room-page-container">
      <div className="room-card">
        <h1 className="room-title">Select Room</h1>
        <p className="room-subtitle">
          Welcome, {currentUser?.displayName || currentUser?.username}
        </p>

        <label htmlFor="room-select" className="form-label">
          Select Room
        </label>
        <select
          id="room-select"
          className="form-select"
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
        >
          <option value="">Choose a room...</option>
          {roomsData?.rooms?.map((room) => (
            <option key={room.id} value={room.id}>
              #{room.name}
            </option>
          ))}
        </select>

        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary add-room-btn"
          >
            <FaPlus /> Add New Room
          </button>
        ) : (
          <div className="add-room-form">
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="form-input"
            />
            <div className="add-room-buttons">
              <button
                onClick={handleAddRoom}
                disabled={!newRoomName.trim()}
                className="btn-primary"
              >
                Add Room
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="navigation-buttons">
          <button onClick={onLogout} className="btn-secondary">
            <FaSignOutAlt /> Logout
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedRoomId}
            className="btn-primary"
          >
            Next <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomSelection;

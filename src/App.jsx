import React, { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from './services/apolloClient';
import AuthPage from './components/AuthPage';
import RoomSelection from './components/RoomSelection';
import ChatPage from './components/ChatPage';

function App() {
  const [currentStep, setCurrentStep] = useState(0); // 0: Auth, 1: Room, 2: Chat
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    console.log('🔍 App - Checking stored data:', { token: !!token, user });
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        console.log('🔍 App - Parsed user from localStorage:', parsedUser);
        setCurrentUser(parsedUser);
        setCurrentStep(1); // Go to room selection
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (user) => {
    console.log('🔐 App - handleLogin called with user:', user);
    setCurrentUser(user);
    setCurrentStep(1); // Go to room selection
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setSelectedRoom(null);
    setCurrentStep(0); // Go back to auth
  };

  const handleRoomSelected = (room) => {
    setSelectedRoom(room);
    setCurrentStep(2);
  };

  const handleBackToRooms = () => {
    setCurrentStep(1);
    setSelectedRoom(null);
  };

  return (
    <ApolloProvider client={client}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {currentStep === 0 && (
          <AuthPage onLogin={handleLogin} />
        )}
        
        {currentStep === 1 && (
          <RoomSelection 
            currentUser={currentUser}
            onRoomSelected={handleRoomSelected}
            onLogout={handleLogout}
          />
        )}
        
        {currentStep === 2 && (
          <ChatPage 
            user={currentUser}
            room={selectedRoom}
            onBack={handleBackToRooms}
            onLogout={handleLogout}
          />
        )}
      </div>
    </ApolloProvider>
  );
}

export default App;
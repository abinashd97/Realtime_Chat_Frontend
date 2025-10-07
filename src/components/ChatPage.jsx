import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { client } from '../services/apolloClient';
import { GET_MESSAGES, SEND_MESSAGE, MESSAGE_SUBSCRIPTION } from '../services/graphqlQueries';

const ChatPage = ({ user, room, onBack, onLogout }) => {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);
  const messagesEndRef = useRef(null);

  // Debug props and fetch user data
  useEffect(() => {
    console.log('🔍 ChatPage - Props received:', { user, room });
    
    const fetchUserData = async () => {
      console.log('🚀 Starting user data fetch...');
      
      // If we have a user prop, use it
      if (user) {
        console.log('✅ Using user from props:', user);
        setCurrentUser(user);
        return;
      }
      
      // Otherwise, get user from localStorage or JWT
      const storedUser = localStorage.getItem('user');
      console.log('🔍 Stored user in localStorage:', storedUser);
      
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('🔧 ChatPage - Using user from localStorage:', parsedUser);
          setCurrentUser(parsedUser);
          return;
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      
      // Fallback: Get user from JWT and database
      const token = localStorage.getItem('authToken');
      console.log('🔍 Auth token exists:', !!token);
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔧 JWT payload:', payload);
          console.log('🔍 Looking for username:', payload.sub);
          
          // Fetch users to find the one with matching username
          console.log('🔍 Fetching users from database...');
          const { data } = await client.query({
            query: gql`
              query GetUsers {
                users {
                  id
                  username
                  displayName
                }
              }
            `
          });
          
          console.log('👥 Available users:', data.users);
          
          // Find user with matching username
          const foundUser = data.users.find(u => u.username === payload.sub);
          console.log('🔍 User search result:', foundUser);
          
          if (foundUser) {
            console.log('✅ Found user in database:', foundUser);
            setCurrentUser(foundUser);
            // Store the correct user data for future use
            localStorage.setItem('user', JSON.stringify(foundUser));
            console.log('💾 Stored user in localStorage');
          } else {
            console.error('❌ User not found in database:', payload.sub);
            console.log('Available usernames:', data.users.map(u => u.username));
            
            // TEMPORARY WORKAROUND: Create user object with username as ID
            // This happens when backend creates JWT but doesn't create user in database
            console.log('🔧 Creating temporary user object for:', payload.sub);
            const tempUser = {
              id: payload.sub, // Use username as ID temporarily
              username: payload.sub,
              displayName: payload.sub
            };
            setCurrentUser(tempUser);
            localStorage.setItem('user', JSON.stringify(tempUser));
            console.log('💾 Stored temporary user in localStorage');
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
        }
      } else {
        console.log('❌ No auth token found');
      }
    };
    
    fetchUserData();
  }, [user, room]);
  
  const { data: messagesData, loading, refetch, error } = useQuery(GET_MESSAGES, {
    variables: { roomId: room?.id },
    skip: !room?.id,
    errorPolicy: 'all',
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

  // Subscribe to new messages
  const { data: subscriptionData, error: subscriptionError } = useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { roomId: room?.id || '' },
    skip: !room?.id,
    onSubscriptionData: ({ subscriptionData }) => {
      console.log('Subscription data received:', subscriptionData);
      if (subscriptionData.data?.messageAdded) {
        const newMessage = subscriptionData.data.messageAdded;
        console.log('New message from subscription:', newMessage);
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {
            console.log('Message already exists, not adding duplicate');
            return prev;
          }
          console.log('Adding new message to state');
          return [...prev, newMessage];
        });
      }
    }
  });

  // Log subscription errors
  useEffect(() => {
    if (subscriptionError) {
      console.error('Subscription error:', subscriptionError);
    }
  }, [subscriptionError]);

  // Update messages when data changes
  useEffect(() => {
    console.log('Messages data changed:', messagesData);
    if (messagesData?.messagesByRoom) {
      console.log('Setting messages from query:', messagesData.messagesByRoom);
      setMessages(messagesData.messagesByRoom);
    }
  }, [messagesData]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    console.log('=== SEND BUTTON CLICKED ===');
    console.log('messageText:', messageText);
    console.log('currentUser:', currentUser);
    console.log('room:', room);
    console.log('authToken:', localStorage.getItem('authToken'));

    if (!messageText.trim() || !currentUser || !room) {
      console.log('❌ Missing required data:', {
        hasMessage: !!messageText.trim(),
        hasUser: !!currentUser,
        hasRoom: !!room
      });
      return;
    }

    const messageContent = messageText.trim();
    setMessageText(''); // Clear input immediately for better UX

    try {
      console.log('🚀 Sending message with variables:', {
        senderId: currentUser.id,
        roomId: room.id,
        content: messageContent
      });

      const result = await sendMessage({
        variables: {
          senderId: currentUser.id,
          roomId: room.id,
          content: messageContent
        }
      });
      
      console.log('✅ Message sent successfully:', result.data);
      
      // Refetch messages to ensure we have the latest data
      refetch();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
      
      // Log detailed GraphQL errors
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        console.error('GraphQL Errors:', error.graphQLErrors);
        error.graphQLErrors.forEach((gqlError, index) => {
          console.error(`GraphQL Error ${index + 1}:`, {
            message: gqlError.message,
            locations: gqlError.locations,
            path: gqlError.path,
            extensions: gqlError.extensions
          });
        });
      }
      
      // Restore the message text if sending failed
      setMessageText(messageContent);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {(currentUser?.displayName || currentUser?.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {currentUser?.displayName || currentUser?.username}
              </h1>
              <p className="text-gray-500">in #{room?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-500">Online</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="Logout"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-96 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Debug info - remove this later
            <div className="text-xs text-gray-400 mb-2">
              Debug: {messages.length} messages, Room: {room?.id}, User: {currentUser?.id}
              {error && <div className="text-red-500">Query Error: {error.message}</div>}
              {subscriptionError && <div className="text-red-500">Subscription Error: {subscriptionError.message}</div>}
              <button 
                onClick={async () => {
                  console.log('🧪 Testing GraphQL connection...');
                  console.log('Token:', localStorage.getItem('authToken'));
                  console.log('User:', user);
                  console.log('Room:', room);
                  
                  // Test if we can fetch users
                  try {
                    const { data } = await client.query({
                      query: gql`
                        query GetUsers {
                          users {
                            id
                            username
                            displayName
                          }
                        }
                      `
                    });
                    console.log('👥 Available users:', data.users);
                  } catch (error) {
                    console.error('❌ Error fetching users:', error);
                  }
                }}
                className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs"
              >
                Test Connection
              </button>
            </div> */}
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = currentUser?.id === message.sender.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {message.sender.displayName || message.sender.username}
                        </div>
                      )}
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!messageText.trim() || sending}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  messageText.trim() && !sending
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-sm'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { FaArrowLeft, FaSignOutAlt, FaPaperPlane } from "react-icons/fa";
import {
  GET_MESSAGES,
  SEND_MESSAGE,
  MESSAGE_SUBSCRIPTION,
  GET_USERS,
} from "../services/graphqlQueries";
import { client } from "../services/apolloClient";

const ChatPage = ({ user, room, onBack, onLogout }) => {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);
  const messagesEndRef = useRef(null);

  // Fetch current user data if necessary
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setCurrentUser(user);
        return;
      }
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        setCurrentUser(JSON.parse(storedUser));
        return;
      }
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const { data } = await client.query({ query: GET_USERS });
          const foundUser = data.users.find((u) => u.username === payload.sub);
          if (foundUser) {
            setCurrentUser(foundUser);
            localStorage.setItem("user", JSON.stringify(foundUser));
          }
        } catch (e) {
          // fallback: create user object if not found
          const tempUser = {
            id: payload.sub,
            username: payload.sub,
            displayName: payload.sub,
          };
          setCurrentUser(tempUser);
          localStorage.setItem("user", JSON.stringify(tempUser));
        }
      }
    };
    fetchUserData();
  }, [user, room]);

  // Load messages initially and after sending
  const {
    data: messagesData,
    loading,
    refetch,
  } = useQuery(GET_MESSAGES, {
    variables: { roomId: room?.id },
    skip: !room?.id,
    errorPolicy: "all",
    fetchPolicy: "network-only",
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

  // Update message list from initial query
  useEffect(() => {
    if (messagesData?.messagesByRoom) setMessages(messagesData.messagesByRoom);
  }, [messagesData]);

  // Handle subscriptions for real-time updates
  useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { roomId: room?.id || "" },
    skip: !room?.id,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.messageAdded) {
        const newMessage = subscriptionData.data.messageAdded;
        setMessages((prev) =>
          prev.some((msg) => msg.id === newMessage.id)
            ? prev
            : [...prev, newMessage]
        );
      }
    },
  });

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Message send logic - update state optimistically
  const handleSend = async () => {
    if (!messageText.trim() || !currentUser || !room) return;
    const trimmedMessage = messageText.trim();
    setMessageText("");
    try {
      const { data } = await sendMessage({
        variables: {
          senderId: currentUser.id,
          roomId: room.id,
          content: trimmedMessage,
        },
      });
      if (data?.sendMessage) {
        // Optimistically add new sent message!
        setMessages((prev) => [...prev, data.sendMessage]);
      }
      // Optionally refetch for full sync (if you want to always stay in sync with backend)
      await refetch();
    } catch (e) {
      setMessageText(trimmedMessage);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="chat-page-container">
        <p className="loading-text">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="chat-page-container">
      <div className="chat-box">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <button className="icon-btn" onClick={onBack} title="Back to Rooms">
              <FaArrowLeft size={20} />
            </button>
            <div className="avatar-circle">
              {(currentUser?.displayName ||
                currentUser?.username ||
                "U")[0].toUpperCase()}
            </div>
            <div className="header-user-info">
              <h2>{currentUser?.displayName || currentUser?.username}</h2>
              <p>in #{room?.name}</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="status-indicator">
              <div className="online-dot"></div>Online
            </div>
            <button className="icon-btn" onClick={onLogout} title="Logout">
              <FaSignOutAlt size={18} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <main className="messages-area">
          {messages.length === 0 ? (
            <p>No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => {
              const isOwn = currentUser?.id === msg.sender.id;
              return (
                <div
                  key={msg.id}
                  className={`message ${isOwn ? "own" : "other"}`}
                >
                  {!isOwn && (
                    <div className="sender-name">
                      {msg.sender.displayName || msg.sender.username}
                    </div>
                  )}
                  <div className="message-content">{msg.content}</div>
                  <div className="message-info">
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input area */}
        <footer className="input-area">
          <div className="message-input-container">
            <textarea
              className="message-input"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />
            <button
              disabled={!messageText.trim() || sending}
              className="send-btn"
              onClick={handleSend}
              title="Send Message"
            >
              {sending ? "Sending..." : <FaPaperPlane size={18} />}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;

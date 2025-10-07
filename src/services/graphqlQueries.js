import { gql } from '@apollo/client';

// Queries
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      displayName
    }
  }
`;

export const GET_ROOMS = gql`
  query GetRooms {
    rooms {
      id
      name
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($roomId: String!) {
    messagesByRoom(roomId: $roomId) {
      id
      content
      timestamp
      sender {
        id
        username
        displayName
      }
    }
  }
`;

// Mutations
export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $displayName: String) {
    createUser(username: $username, displayName: $displayName) {
      id
      username
      displayName
    }
  }
`;

export const CREATE_ROOM = gql`
  mutation CreateRoom($name: String!) {
    createRoom(name: $name) {
      id
      name
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($senderId: String!, $roomId: String!, $content: String!) {
    sendMessage(senderId: $senderId, roomId: $roomId, content: $content) {
      id
      content
      timestamp
      sender {
        id
        username
        displayName
      }
    }
  }
`;

// Subscriptions
export const MESSAGE_SUBSCRIPTION = gql`
  subscription MessageAdded($roomId: String!) {
    messageAdded(roomId: $roomId) {
      id
      content
      timestamp
      sender {
        id
        username
        displayName
      }
    }
  }
`;

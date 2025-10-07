import { ApolloClient, InMemoryCache, split, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP link
const httpLink = new HttpLink({
  uri: 'http://localhost:8080/graphql',
});

// Auth link to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  console.log('🔐 Apollo Client - Adding auth token:', token ? 'Token present' : 'No token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// WebSocket link with auth
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:8080/graphql',
  connectionParams: () => {
    const token = localStorage.getItem('authToken');
    return {
      authorization: token ? `Bearer ${token}` : "",
    };
  },
}));

// Split link
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  from([authLink, httpLink])
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

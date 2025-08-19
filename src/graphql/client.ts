import {
  ApolloClient,
  HttpLink,
  split,
  InMemoryCache,
  gql,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const PORT = 4000;

const httpLink = new HttpLink({
  uri: (operation) =>
    `http://localhost:${PORT}/graphql?op=${operation.operationName}`,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `ws://localhost:${PORT}/graphql`,
  }),
);

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink,
);

const cache = new InMemoryCache({});

export const client = new ApolloClient({
  link,
  cache,
});

export const GET_MESSAGES = gql`
  query Messages($first: Int, $after: MessagesCursor, $before: MessagesCursor) {
    messages(first: $first, after: $after, before: $before) {
      edges {
        node {
          id
          text
          status
          updatedAt
          sender
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const MESSAGE_ADDED = gql`
  subscription {
    messageAdded {
      id
      text
      status
      updatedAt
      sender
    }
  }
`;

export const MESSAGE_UPDATED = gql`
  subscription {
    messageUpdated {
      id
      text
      status
      updatedAt
      sender
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($text: String!) {
    sendMessage(text: $text) {
      id
      text
      status
      updatedAt
    }
  }
`;
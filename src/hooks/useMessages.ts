import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_MESSAGES,
  MESSAGE_ADDED,
  MESSAGE_UPDATED,
} from "../graphql/client.ts";
import { MessageEdge } from "../../__generated__/resolvers-types.ts";

export function useMessages() {
  const { data, loading, fetchMore, subscribeToMore } = useQuery(GET_MESSAGES, {
    variables: { first: 10 }, // начальная загрузка
    fetchPolicy: "cache-and-network",
  });


  useEffect(() => {
    const unsubAdded = subscribeToMore({
      document: MESSAGE_ADDED,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newMsg = subscriptionData.data.messageAdded;

        return {
          ...prev,
          messages: {
            ...prev.messages,
            edges: [
              ...prev.messages.edges,
              { node: newMsg, cursor: newMsg.id },
            ],
            pageInfo: prev.messages.pageInfo,
          },
        };
      },
    });
    const unsubUpdated = subscribeToMore({
      document: MESSAGE_UPDATED,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const updated = subscriptionData.data.messageUpdated;
        return {
          ...prev,
          messages: {
            ...prev.messages,
            edges: prev.messages.edges.map((edge: MessageEdge) =>
              edge.node.id === updated.id ? { ...edge, node: updated } : edge,
            ),
          },
        };
      },
    });

    return () => {
      unsubUpdated();
      unsubAdded();
    };
  }, [subscribeToMore]);

  const messages = data?.messages?.edges.map((e: MessageEdge) => e.node) ?? [];

  const loadOlder = async () => {
    if (!data?.messages.pageInfo.hasNextPage) return;
    const cursor = data.messages.pageInfo.endCursor;
    await fetchMore({
      variables: { first: 5, after: cursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        const mergedEdges = [
          ...prev.messages.edges,
          ...fetchMoreResult.messages.edges,
        ];


        const map = new Map();
        for (const e of mergedEdges) map.set(e.node.id, e);
        const merged = Array.from(map.values()).sort(
          (a, b) =>
            new Date(a.node.updatedAt).getTime() -
            new Date(b.node.updatedAt).getTime(),
        );

        return {
          messages: {
            ...fetchMoreResult.messages,
            edges: merged,
          },
        };
      },
    });
  };

  const loadNewer = async () => {
    if (!data?.messages.pageInfo.hasPreviousPage) return;
    const cursor = data.messages.pageInfo.startCursor;
    await fetchMore({
      variables: { first: 5, before: cursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        console.log(prev, fetchMoreResult);
        if (!fetchMoreResult) return prev;
        const mergedEdges = [
          ...fetchMoreResult.messages.edges,
          ...prev.messages.edges,
        ];
        const map = new Map();
        for (const e of mergedEdges) map.set(e.node.id, e);
        const merged = Array.from(map.values()).sort(
          (a, b) =>
            new Date(a.node.updatedAt).getTime() -
            new Date(b.node.updatedAt).getTime(),
        );
        return {
          messages: {
            ...fetchMoreResult.messages,
            edges: merged,
          },
        };
      },
    });
  };

  return { messages, loading, loadOlder, loadNewer };
}

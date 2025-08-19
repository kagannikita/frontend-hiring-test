import { useMutation } from "@apollo/client";
import {SEND_MESSAGE} from "../graphql/client.ts";

export function useSendMessage() {
  const [sendMessageMutation, { loading, error }] = useMutation(SEND_MESSAGE);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      const { data } = await sendMessageMutation({
        variables: { text },
        optimisticResponse: {
          sendMessage: {
            id: `temp-${Date.now()}`,
            text,
            status: "Sending",
            updatedAt: new Date().toISOString(),
            __typename: "Message",
          },
        },
      });
      return data?.sendMessage;
    } catch (e) {
      console.error("Ошибка при отправке:", e);
    }
  };

  return { sendMessage, loading, error };
}

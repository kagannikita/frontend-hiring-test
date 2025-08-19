import React, { useState } from "react";
import { ItemContent, Virtuoso } from "react-virtuoso";
import cn from "clsx";
import { MessageSender, type Message } from "../__generated__/resolvers-types";
import css from "./chat.module.css";

import { useMessages } from "./hooks/useMessages.ts";
import { useSendMessage } from "./hooks/useMessageSent.ts";

// const temp_data: Message[] = Array.from(Array(30), (_, index) => ({
//   id: String(index),
//   text: `Message number ${index}`,
//   status: MessageStatus.Read,
//   updatedAt: new Date().toISOString(),
//   sender: index % 2 ? MessageSender.Admin : MessageSender.Customer,
// }));

const Item: React.FC<Message> = ({ text, sender }) => {
  return (
    <div className={css.item}>
      <div
        className={cn(
          css.message,
          sender === MessageSender.Admin ? css.out : css.in,
        )}
      >
        {text}
      </div>
    </div>
  );
};

const getItem: ItemContent<Message, unknown> = (_, data) => {
  return <Item {...data} />;
};

export const Chat: React.FC = () => {
  const { messages, loadOlder } = useMessages();
  const [text, setText] = useState("");
  const { sendMessage } = useSendMessage();

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(text);
    setText("");
  };

  return (
    <div className={css.root}>
      <div className={css.container}>
        <Virtuoso
          className={css.list}
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          endReached={loadOlder}
          itemContent={getItem}
        />
      </div>
      <div className={css.footer}>
        <input
          type="text"
          value={text}
          className={css.textInput}
          placeholder="Message text"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

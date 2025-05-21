// components/Chat/MessageList.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import MessageItem from './MessageItem';

const MessageList = ({ messages, onMessageAction }) => {
  // Обработчики для действий с сообщениями
  const handleMessageAction = (action, data) => {
    if (onMessageAction) {
      onMessageAction(action, data);
    }
  };

  if (!messages || messages.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Начните общение с Claude, отправив сообщение
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        const isUser = message.role === 'user';
        
        return (
          <MessageItem
            key={message.id}
            message={message}
            isLast={isLast && !isUser}
            onAction={handleMessageAction}
            showTimestamp={true}
            compact={false}
          />
        );
      })}
    </Box>
  );
};

export default MessageList;
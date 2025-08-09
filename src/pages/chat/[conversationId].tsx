// pages/chat/[conversationId].tsx
import React from 'react';
import { useRouter } from 'next/router';
import ChatLayout from '../../components/chat/ChatLayout';

const ConversationPage = () => {
  const router = useRouter();
  const { conversationId } = router.query;

  // Convert router query to string
  const conversationIdString = Array.isArray(conversationId) 
    ? conversationId[0] 
    : conversationId;

  return <ChatLayout initialConversationId={conversationIdString} />;
};

export default ConversationPage;
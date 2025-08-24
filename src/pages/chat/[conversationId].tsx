// In ConversationPage.tsx

import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import AuthContext from '../../context/AuthContext';
import ChatLayout from '../../components/chat/ChatInterface';

const ConversationPage = () => {
  const router = useRouter();
  const { conversationId } = router.query;
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  
  // This correctly results in a type of 'string | undefined'
  const conversationIdString = Array.isArray(conversationId)
    ? conversationId[0]
    : conversationId;

  // Show loading while checking auth or initializing Signal
  if (authLoading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return <div>Redirecting to login...</div>;
  }

  // No 'any' needed! TypeScript now understands the prop.
  return (
    <ChatLayout 
      initialConversationId={conversationIdString}
    />
  );
};

export default ConversationPage;
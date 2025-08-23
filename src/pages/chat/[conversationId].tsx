import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import AuthContext from '../../context/AuthContext';
import { useSignalProtocol } from '../../context/SignalContext';
import ChatLayout from '../../components/chat/ChatInterface';

const ConversationPage = () => {
  const router = useRouter();
  const { conversationId } = router.query;
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { isInitialized, isLoading: signalLoading } = useSignalProtocol();
  
  // Convert router query to string
  const conversationIdString = Array.isArray(conversationId)
    ? conversationId[0]
    : conversationId;

  // Show loading while checking auth or initializing Signal
  if (authLoading || signalLoading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return <div>Redirecting to login...</div>;
  }

  return (
    <ChatLayout 
      {...({ initialConversationId: conversationIdString } as any)}
    />
  );
};

export default ConversationPage;
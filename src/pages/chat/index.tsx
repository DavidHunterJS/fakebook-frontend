// // pages/chat/index.tsx
// import React from 'react';
// import { useRouter } from 'next/router';
// import ChatLayout from '../../components/chat/ChatInterface';
// import useAuth from '../../hooks/useAuth';
// import { SocketProvider } from '../../context/SocketContext';

// const ChatPage = () => {
//   const { user, loading, isAuthenticated } = useAuth();
//   const router = useRouter();

//   React.useEffect(() => {
//     if (!loading && !isAuthenticated) {
//       router.push('/login');
//     }
//   }, [user, loading, router, isAuthenticated]);

//   if (loading) return <div>Loading...</div>;
//   if (!isAuthenticated) return null;

//   return (
//     <SocketProvider>
//       <ChatLayout />
//     </SocketProvider>
//   );
// };

// export default ChatPage;
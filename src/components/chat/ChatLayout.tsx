import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  AppBar,
  Toolbar,
  Badge,
  Divider,
  Card,
  CardContent,
  Fab,
  CircularProgress,
  Tooltip,
  Popover,
  Zoom,
  Grow,
  Chip,
} from '@mui/material';
import {
  Search,
  Send,
  AttachFile,
  Phone,
  VideoCall,
  Info,
  MoreVert,
  Settings,
  Chat,
  Group,
  FiberManualRecord,
  Add
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import axiosInstance from '../../utils/api';
import NewChatModal from './NewChatModal';
import { getProfileImageUrl } from '../../utils/imgUrl';
import { useMessageVisibility } from '../../hooks/useMessageVisibility';
import { ReadReceiptIndicator } from './ReadReceiptIndicator';
import { Socket } from 'socket.io-client';

// --- INTERFACES ---

interface ChatLayoutProps {
  initialConversationId?: string | string[];
}

interface FileContent {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

interface Reaction {
  userId: string;
  emoji: string;
  timestamp: string;
  user: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface ReadBy {
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  readAt: Date;
}

interface Conversation {
  _id: string;
  name?: string;
  type: 'direct' | 'group';
  participants: Array<{
    userId: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      isOnline: boolean;
    };
    role: 'admin' | 'member';
  }>;
  lastActivity: string;
  lastMessage?: Array<{
    content: { text?: string };
    timestamp: string;
    sender: Array<{
      username: string;
      firstName: string;
      lastName: string;
    }>;
  }>;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: { text?: string; file?: FileContent; gif?: { url: string } };
  messageType: 'text' | 'file' | 'gif' | 'system';
  timestamp: string;
  reactions?: Reaction[];
  sender?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  readBy?: ReadBy[];
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
  currentUserId: string;
}

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

interface EnhancedMessageBubbleProps extends MessageBubbleProps {
  socket: Socket | null;
  isConnected: boolean;
  activeConv: Conversation | undefined;
}
interface NewMessageData {
    message: Message;
    sender?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

// --- CHILD COMPONENTS ---

const ConversationItem: React.FC<ConversationItemProps> = memo(({
  conversation,
  isActive,
  onClick,
  currentUserId
}) => {
  const getConversationInfo = useCallback(() => {
    if (conversation.type === 'group') {
      return {
        name: conversation.name || 'Group Chat',
        avatar: conversation.name?.charAt(0).toUpperCase() || 'G',
        isOnline: false
      };
    }
    const otherParticipant = conversation.participants?.find(p => p.userId._id !== currentUserId)?.userId;
    if (otherParticipant) {
      const fullName = `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim();
      const displayName = fullName || otherParticipant.username || 'Unknown User';
      const initials = (otherParticipant.firstName?.charAt(0) || '') + (otherParticipant.lastName?.charAt(0) || '') || 'U';
      return {
        name: displayName,
        avatar: otherParticipant.profilePicture || initials,
        isOnline: otherParticipant.isOnline || false,
      };
    }
    return { name: 'Unknown User', avatar: 'U', isOnline: false };
  }, [conversation, currentUserId]);

  const { name, avatar, isOnline } = getConversationInfo();
  const lastMessage = conversation.lastMessage?.[0];
  const lastMessageText = lastMessage?.content?.text || 'No messages yet';
  const lastMessageSender = lastMessage?.sender?.[0];
  const displayMessage = conversation.type === 'group' && lastMessageSender ? `${lastMessageSender.firstName}: ${lastMessageText}` : lastMessageText;

  return (
    <ListItem
      onClick={() => onClick(conversation._id)}
      sx={{
        borderRadius: 1, mb: 0.5, cursor: 'pointer',
        backgroundColor: isActive ? 'primary.light' : 'transparent',
        '&:hover': { backgroundColor: isActive ? 'primary.light' : 'action.hover' },
      }}
    >
      <ListItemAvatar>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={isOnline ? <FiberManualRecord sx={{ color: 'success.main', fontSize: 12 }} /> : null}
        >
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <img
              src={getProfileImageUrl(avatar)} alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={(e) => {
                const img = e.currentTarget;
                const parent = img.parentElement;
                if (parent) {
                  img.style.display = 'none';
                  const fallbackInitials = typeof avatar === 'string' && !avatar.startsWith('http') ? avatar : name.charAt(0);
                  parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold; color: white; background-color: #1976d2; border-radius: 50%;">${fallbackInitials}</div>`;
                }
              }}
            />
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Typography variant="subtitle2" noWrap>{name}</Typography>
              {conversation.type === 'group' && <Group sx={{ ml: 0.5, fontSize: 16, color: 'text.secondary' }} />}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {new Date(conversation.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        }
        secondary={
          <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>{displayMessage}</Typography>
        }
      />
    </ListItem>
  );
});
ConversationItem.displayName = 'ConversationItem';

memo(ConversationItem); 

// --- MAIN COMPONENT ---
const ChatLayout: React.FC<ChatLayoutProps> = ({ initialConversationId }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket, isConnected } = useSocket();

  const [activeConversation, setActiveConversation] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: { username: string; firstName: string; lastName: string } }>({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reactionAnchor, setReactionAnchor] = useState<HTMLElement | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');
  const [messageReactions, setMessageReactions] = useState<{ [messageId: string]: Reaction[] }>({});

  const activeConv = conversations.find(c => c._id === activeConversation);

  // --- CHILD COMPONENTS DEFINED WITHIN CHATLAYOUT SCOPE ---

  const ReactionPicker: React.FC = () => {
    const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];
    const moreEmojis = ['✨', '💯', '👏', '🙌', '💪', '🤔', '😍', '🥳'];
  
    const handleReactionClick = (emoji: string) => {
      if (socket && selectedMessageId) {
        socket.emit('addReaction', { messageId: selectedMessageId, emoji });
      }
      setReactionAnchor(null);
      setSelectedMessageId('');
    };
  
    return (
      <Popover
        open={Boolean(reactionAnchor)}
        anchorEl={reactionAnchor}
        onClose={() => { setReactionAnchor(null); setSelectedMessageId(''); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', p: 1, minWidth: '320px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', transform: 'translateZ(0)' } }}
      >
        <Box>
          <Typography variant="caption" sx={{ px: 1, color: '#666666', fontWeight: 'bold' }}>Quick Reactions</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, p: 1 }}>
            {quickReactions.map((emoji) => (
              <IconButton key={emoji} onClick={() => handleReactionClick(emoji)} sx={{ width: 40, height: 40, borderRadius: '12px', transition: 'all 0.2s ease', '&:hover': { transform: 'scale(1.2)', backgroundColor: '#eeeeee' }, color: 'transparent !important', '& span': { color: 'initial !important', opacity: '1 !important', filter: 'none !important' } }}>
                <span style={{ fontSize: '24px' }}>{emoji}</span>
              </IconButton>
            ))}
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ px: 1, color: '#666666', fontWeight: 'bold' }}>More Emojis</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1 }}>
            {moreEmojis.map((emoji) => (
              <IconButton key={emoji} onClick={() => handleReactionClick(emoji)} sx={{ width: 36, height: 36, borderRadius: '10px', transition: 'all 0.2s ease', '&:hover': { transform: 'scale(1.15)', backgroundColor: '#eeeeee' }, color: 'transparent !important', '& span': { color: 'initial !important', opacity: '1 !important', filter: 'none !important' } }}>
                <span style={{ fontSize: '20px' }}>{emoji}</span>
              </IconButton>
            ))}
          </Box>
        </Box>
      </Popover>
    );
  };
    
  const FloatingReactionButton: React.FC<{ messageId: string, visible: boolean, isOwn: boolean }> = ({ messageId, visible, isOwn }) => {
    const handleReactionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setReactionAnchor(e.currentTarget as HTMLElement);
      setSelectedMessageId(messageId);
    };

    return (
      <Zoom in={visible} timeout={200}>
        <Tooltip title="Add reaction" placement="top">
          <IconButton
            onClick={handleReactionClick}
            sx={{
              position: 'absolute', top: -16, ...(isOwn ? { left: 8 } : { right: 8 }), zIndex: 10, width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', transition: 'all 0.2s ease',
              color: 'transparent !important',
              '& span': { color: 'initial !important', opacity: '1 !important', filter: 'none !important', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
              '&:hover': { backgroundColor: 'primary.main', transform: 'scale(1.1)', boxShadow: '0 6px 20px rgba(25,118,210,0.4)' }
            }}
          >
            <span>😊</span>
          </IconButton>
        </Tooltip>
      </Zoom>
    );
  };
  
  const MessageReactionsDisplay: React.FC<{ messageId: string }> = ({ messageId }) => {
    const reactions = messageReactions[messageId] || [];
    if (reactions.length === 0) return null;

    const groupedReactions = reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || []);
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as { [emoji: string]: Reaction[] });

    const handleReactionClick = (emoji: string) => {
      if (socket) {
        socket.emit('addReaction', { messageId, emoji });
      }
    };

    return (
      <Grow in={true} timeout={300}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
          {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
            const userHasReacted = reactionList.some(r => r.user?._id === user?._id);
            const reactorNames = reactionList.map(r => `${r.user.firstName} ${r.user.lastName}`).join(', ');

            return (
              <Tooltip key={emoji} title={`${reactorNames} reacted with ${emoji}`} placement="top">
                <Chip
                  label={ <Box sx={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}> <Box component="span" sx={{ mr: 0.5, fontSize: '16px' }}>{emoji}</Box> <Box component="span">{reactionList.length}</Box> </Box> }
                  onClick={() => handleReactionClick(emoji)}
                  size="small"
                  sx={{ height: 28, borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: userHasReacted ? '#e3f2fd' : '#f5f5f5', color: userHasReacted ? '#1976d2' : '#666666', border: userHasReacted ? '1px solid #1976d2' : '1px solid #e0e0e0', transform: 'translateZ(0)', '&:hover': { transform: 'scale(1.05) translateZ(0)', backgroundColor: userHasReacted ? '#1976d2' : '#e0e0e0', color: userHasReacted ? '#ffffff' : '#333333', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Grow>
    );
  };

  const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = memo(({ message, currentUserId, socket, isConnected, activeConv }) => {
  const [isHovering, setIsHovering] = useState(false);
  const isOwn = message.senderId === currentUserId;

  const onVisible = useCallback(() => {
    const alreadyReadByMe = (message.readBy || []).some(r => r.userId._id === currentUserId);
    if (!isOwn && !alreadyReadByMe && socket && isConnected) {
      socket.emit('mark_message_read', {
        conversationId: message.conversationId,
        messageId: message._id
      });
    }
  }, [isOwn, message, currentUserId, socket, isConnected]);

  const messageRef = useMessageVisibility(onVisible);
  
  return (
    <Box ref={messageRef} display="flex" justifyContent={isOwn ? 'flex-end' : 'flex-start'} mb={2} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      {!isOwn && <Avatar src={getProfileImageUrl(message.sender?.profilePicture)} sx={{ mr: 1, width: 32, height: 32 }} />}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', position: 'relative' }}>
        <FloatingReactionButton messageId={message._id} visible={isHovering} isOwn={isOwn} />
        <Card sx={{ maxWidth: { xs: '280px', sm: '400px', md: '500px' }, bgcolor: isOwn ? 'primary.main' : 'grey.100', color: isOwn ? 'primary.contrastText' : 'text.primary' }}>
          <CardContent sx={{ p: 1.5, pb: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{message.content.text}</Typography>
            <Typography variant="caption" sx={{ color: isOwn ? 'primary.contrastText' : 'text.secondary', opacity: 0.7, mt: 0.5, display: 'block', textAlign: 'right' }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', mt: 0.5, px: 0.5 }}>
          <MessageReactionsDisplay messageId={message._id} />
          {/* ✨ This line is now corrected */}
          {isOwn && activeConv && (
            <ReadReceiptIndicator 
              readBy={message.readBy || []} 
              conversationType={activeConv.type}
              senderId={message.senderId}
              currentUserId={currentUserId}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
});
EnhancedMessageBubble.displayName = 'EnhancedMessageBubble'
memo(EnhancedMessageBubble);

  // --- LOGIC AND useEffect HOOKS ---
  
  const loadConversations = useCallback(async (selectConversationId?: string) => {
    if (!isAuthenticated || !user) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get('/conversations');
      const loadedConversations = response.data.conversations || [];
      setConversations(loadedConversations);
      if (selectConversationId) {
        setActiveConversation(selectConversationId);
      } else if (!activeConversation && loadedConversations.length > 0) {
        setActiveConversation(loadedConversations[0]._id);
      }
    } catch (error) { console.error('Error loading conversations:', error); } 
    finally { setLoading(false); }
  }, [isAuthenticated, user, activeConversation]);

  useEffect(() => {
    const conversationId = Array.isArray(initialConversationId) ? initialConversationId[0] : initialConversationId;
    if (conversationId) {
      setActiveConversation(conversationId);
    } else if (isAuthenticated && user && !activeConversation) {
      loadConversations();
    }
  }, [initialConversationId, isAuthenticated, user, activeConversation, loadConversations]);


  const handleNewConversationCreated = useCallback(async (newConversationId: string) => {
    setShowNewChatModal(false);
    await loadConversations(newConversationId);
  }, [loadConversations]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversation || !isAuthenticated) return;
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/messages/${activeConversation}`);
        const loadedMessages: Message[] = response.data.messages || [];
        setMessages(loadedMessages);

        const reactionsMap = loadedMessages.reduce((acc, msg) => {
          if (msg.reactions && msg.reactions.length > 0) {
            acc[msg._id] = msg.reactions;
          }
          return acc;
        }, {} as { [messageId: string]: Reaction[] });
        setMessageReactions(reactionsMap);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
        setMessageReactions({});
      } finally {
        setLoading(false);
      }
    };
    if (activeConversation) {
      loadMessages();
    } else {
      setMessages([]);
      setMessageReactions({});
    }
  }, [activeConversation, isAuthenticated]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;
    
    if (activeConversation) {
      socket.emit('joinConversation', { conversationId: activeConversation });
      setTypingUsers({});
    }

    const handleNewMessage = (data: NewMessageData) => {
      if (data.message.conversationId === activeConversation) {
        setMessages(prev => [...prev, { ...data.message, sender: data.sender }]);
      }
    };

    const handleUserTyping = (data: { userId: string, conversationId: string; isTyping: boolean, firstName: string, lastName: string, username: string }) => {
      if (data.conversationId === activeConversation && data.userId !== user._id) {
        setTypingUsers(prev => {
          const updated = { ...prev };
          if (data.isTyping) {
            updated[data.userId] = { username: data.username, firstName: data.firstName, lastName: data.lastName };
          } else {
            delete updated[data.userId];
          }
          return updated;
        });
      }
    };
    
    const handleReactionUpdate = (data: { messageId: string, reactions: Reaction[] }) => {
      if (!activeConversation) return;
      setMessageReactions(prev => ({
        ...prev,
        [data.messageId]: data.reactions
      }));
    };

    const handleMessageRead = (data: { messageId: string, readBy: ReadBy }) => {
      if (!activeConversation) return;
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === data.messageId) {
            const newReadBy = [...(msg.readBy || []), data.readBy];
            const uniqueReadBy = Array.from(new Map(newReadBy.map(item => [item.userId._id, item])).values());
            return { ...msg, readBy: uniqueReadBy };
          }
          return msg;
        })
      );
    };

    socket.on('newChatMessage', handleNewMessage);
    socket.on('userChatTyping', handleUserTyping);
    socket.on('reactionUpdate', handleReactionUpdate);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('newChatMessage', handleNewMessage);
      socket.off('userChatTyping', handleUserTyping);
      socket.off('reactionUpdate', handleReactionUpdate);
      socket.off('message_read', handleMessageRead);
    };
  }, [socket, isConnected, activeConversation, user]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation || !socket) return;
    socket.emit('sendChatMessage', { conversationId: activeConversation, content: { text: messageInput }, messageType: 'text' as const });
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!activeConversation || uploadingFile) return;
    setUploadingFile(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('chatFile', file);
      formData.append('conversationId', activeConversation);
      await axiosInstance.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
    } catch (error) { console.error('❌ Error uploading file:', error); } 
    finally { setUploadingFile(false); setUploadProgress(0); }
  }, [activeConversation, uploadingFile]);
  
  const handleFileSelect = (files: FileList | null) => { if (files && files.length > 0) uploadFile(files[0]); };
  // const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  // const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault(); setIsDragOver(false);
  //   if (e.dataTransfer.files?.length > 0) uploadFile(e.dataTransfer.files[0]);
  // };

  const handleTyping = useCallback(() => {
    if (!socket || !activeConversation) return;
    if (typingTimeout) clearTimeout(typingTimeout);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('chatTyping', { conversationId: activeConversation, isTyping: true });
    }
    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('chatTyping', { conversationId: activeConversation, isTyping: false });
    }, 2000);
    setTypingTimeout(timeout);
  }, [socket, activeConversation, isTyping, typingTimeout]);

  useEffect(() => { return () => { if (typingTimeout) clearTimeout(typingTimeout); }; }, [typingTimeout]);

  const filteredConversations = conversations.filter(conv => {
    if (!user) return false;
    let name = '';
    if (conv.type === 'group') {
      name = conv.name || 'Group Chat';
    } else {
      const otherParticipant = conv.participants.find(p => p.userId._id !== user._id)?.userId;
      if (otherParticipant) {
        name = `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || otherParticipant.username;
      }
    }
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const TypingIndicator: React.FC = () => {
    const typingUserNames = Object.values(typingUsers).map(u => `${u.firstName} ${u.lastName}`.trim() || u.username);
    if (typingUserNames.length === 0) return null;
    const typingText = typingUserNames.length === 1 ? `${typingUserNames[0]} is typing...` : `${typingUserNames.length} users are typing...`;
    return (
      <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, height: '36px' }}>
         <Box sx={{ display: 'flex', gap: 0.3, '& div': { width: 6, height: 6, borderRadius: '50%', backgroundColor: 'text.secondary', animation: 'typing 1.4s infinite ease-in-out', '&:nth-of-type(1)': { animationDelay: '0s' }, '&:nth-of-type(2)': { animationDelay: '0.2s' }, '&:nth-of-type(3)': { animationDelay: '0.4s' }, }, '@keyframes typing': { '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 }, '30%': { transform: 'translateY(-8px)', opacity: 1 } } }}>
          <div /><div /><div />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>{typingText}</Typography>
      </Box>
    );
  };

  // --- JSX RENDER ---
  if (authLoading) return <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (!isAuthenticated || !user) return <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography>Please log in to access chat.</Typography></Box>;

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'grey.50' }}>
      <Paper sx={{ width: 360, display: 'flex', flexDirection: 'column', borderRadius: 0, boxShadow: 2 }}>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <Chat sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Chats</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>{isConnected ? '🟢' : '🔴'}</Typography>
            <IconButton color="primary" onClick={() => setShowNewChatModal(true)} sx={{ mr: 1 }}><Add /></IconButton>
            <IconButton color="inherit"><Settings /></IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 2 }}>
          <TextField fullWidth size="small" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>) }}/>
        </Box>
        <Divider />
        <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box> : (
            <List>
              {filteredConversations.map(c => <ConversationItem key={c._id} conversation={c} isActive={activeConversation === c._id} onClick={setActiveConversation} currentUserId={user._id} />)}
              {filteredConversations.length === 0 && <Box sx={{ textAlign: 'center', p: 2 }}><Typography variant="body2" color="text.secondary">No conversations found</Typography></Box>}
            </List>
          )}
        </Box>
      </Paper>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeConv ? (
          <>
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }} src={(() => {
                  if (activeConv.type === 'direct') {
                    const other = activeConv.participants.find(p => p.userId._id !== user._id)?.userId;
                    return getProfileImageUrl(other?.profilePicture);
                  }
                  return undefined;
                })()}>
                  {(() => {
                    if (activeConv.type === 'group') return activeConv.name?.charAt(0).toUpperCase() || 'G';
                    const other = activeConv.participants.find(p => p.userId._id !== user._id)?.userId;
                    return (other?.firstName?.charAt(0) || '') + (other?.lastName?.charAt(0) || '') || 'U';
                  })()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    {(() => {
                      if (activeConv.type === 'group') return activeConv.name || 'Group Chat';
                      const other = activeConv.participants.find(p => p.userId._id !== user._id)?.userId;
                      return other ? `${other.firstName} ${other.lastName}`.trim() : 'Unknown User';
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeConv.type === 'group' ? `${activeConv.participants.length} members` : activeConv.participants.find(p => p.userId._id !== user._id)?.userId.isOnline ? 'Active now' : 'Offline'}
                  </Typography>
                </Box>
                <Box>
                  <IconButton color="inherit"><Phone /></IconButton>
                  <IconButton color="inherit"><VideoCall /></IconButton>
                  <IconButton color="inherit"><Info /></IconButton>
                  <IconButton color="inherit"><MoreVert /></IconButton>
                </Box>
              </Toolbar>
            </AppBar>
            <Box id="chat-messages-container" sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
              {messages.map(message => (
                <EnhancedMessageBubble
                  key={message._id}
                  message={message}
                  currentUserId={user._id}
                  socket={socket}
                  isConnected={isConnected}
                  activeConv={activeConv}
                />
              ))}
            </Box>
            <TypingIndicator />
            <Paper sx={{ p: 2, borderRadius: 0, borderTop: 1, borderColor: 'divider' }}>
              {uploadingFile && (
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress variant="determinate" value={uploadProgress} size={24} />
                  <Typography variant="body2" color="text.secondary">Uploading: {uploadProgress}%</Typography>
                </Box>
              )}
              <Box display="flex" alignItems="flex-end" gap={1}>
                <input type="file" id="file-upload" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files)} disabled={uploadingFile} />
                <label htmlFor="file-upload"><IconButton color="primary" component="span" disabled={uploadingFile || !isConnected}><AttachFile /></IconButton></label>
                <TextField fullWidth multiline maxRows={4} placeholder="Type a message..." value={messageInput} onChange={(e) => { setMessageInput(e.target.value); handleTyping(); }} onKeyPress={handleKeyPress} variant="outlined" size="small" disabled={uploadingFile} />
                <Fab size="small" color="primary" onClick={handleSendMessage} disabled={!messageInput.trim() || !isConnected || uploadingFile}><Send /></Fab>
              </Box>
            </Paper>
          </>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
            <Box textAlign="center">
              <Chat sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.primary" gutterBottom>Welcome, {user.firstName}!</Typography>
              <Typography variant="body1" color="text.secondary">{conversations.length === 0 ? 'Start a new chat to begin.' : 'Choose a conversation to start messaging.'}</Typography>
            </Box>
          </Box>
        )}
      </Box>

      <ReactionPicker />

      <NewChatModal open={showNewChatModal} onClose={() => setShowNewChatModal(false)} onConversationCreated={handleNewConversationCreated} currentUser={user} axiosInstance={axiosInstance} />
    </Box>
  );
};

export default ChatLayout;
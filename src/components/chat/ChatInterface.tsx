// components/Chat/ChatInterface.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
  Box,
  Button,
  Paper,
  Typography,
  List,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Chip,
  Fade,
  Slide,
  AppBar,
  Toolbar,
  Container,
  Popover,
  CircularProgress,
  Tooltip,
  useTheme,
  alpha,
  ListItemButton,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Circle as CircleIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  TagFaces as TagFacesIcon,
  MoreVert as MoreVertIcon,
  ExitToApp as ExitToAppIcon // Changed from DeleteIcon
} from '@mui/icons-material';
import NewChatDialog from './NewChatDialog';
import { useSocket } from '../../context/SocketContext';
import { getFullImageUrl } from '../../utils/imgUrl';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// ... (interfaces remain the same) ...
// interface ChatInputProps {
//   onSendMessage: (message: string) => void;
//   onUploadFile: (file: File) => void;
//   isUploading: boolean; 
// }

interface ChatLayoutProps {
  initialConversationId?: string;
}

interface Reaction {
  emoji: string;
  userId: string;
}

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  createdAt: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
  }>;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
    metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
}

interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'workflow_chat';
  participants: Array<{
    userId: User;
    role: string;
    isActive: boolean;
  }>;
  title?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: string;
  };
  unreadCount: number;
}


const ChatInterface = ({ initialConversationId }: ChatLayoutProps) => {
  const theme = useTheme();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [reactionPickerAnchor, setReactionPickerAnchor] = useState<HTMLElement | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // State for the conversation options menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversationForMenu, setSelectedConversationForMenu] = useState<Conversation | null>(null);

  // ... (getAvatarUrl, useEffects, and other functions remain the same) ...
  
  const getAvatarUrl = (conversation: Conversation): string | undefined => {
    if (!currentUser || conversation.type === 'group') {
      return undefined;
    }

    const otherParticipant = conversation.participants?.find(
      p => p.userId && p.userId._id !== currentUser._id
    );

    if (otherParticipant?.userId?.profilePicture) {
      return getFullImageUrl(otherParticipant.userId.profilePicture, 'profile');
    }

    return undefined;
  };
  
  useEffect(() => {
    if (initialConversationId) {
      console.log('Starting with conversation:', initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
          setCurrentUser(data.user);
        } else {
          console.error("Could not fetch user profile.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchCurrentUser();
    loadConversations();
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (socket && activeMessageId) {
      socket.emit('toggleReaction', {
        messageId: activeMessageId,
        emoji: emojiData.emoji,
      });
    }
    setReactionPickerAnchor(null);
    setActiveMessageId(null);
  };

  const updateConversationLastMessage = useCallback((message: Message) => {
    setConversations(prev => {
      const index = prev.findIndex(conv => conv._id === message.conversationId);
      if (index === -1) {
        return prev;
      }

      const updatedConv = {
        ...prev[index],
        lastMessage: {
          content: message.messageType === 'text' 
            ? message.content 
            : (message.metadata?.fileName || 'File'),
          senderId: message.senderId._id,
          sentAt: message.createdAt
        }
      };

      const newConversations = [...prev];
      newConversations.splice(index, 1);
      return [updatedConv, ...newConversations];
    });
  }, []);

    useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { message: Message }) => {
      const incomingMessage = data.message;
      updateConversationLastMessage(incomingMessage);
      
      const isForCurrentChat = incomingMessage.conversationId === currentConversation?._id;
      const isFromAnotherUser = incomingMessage.senderId._id !== currentUser?._id;

      if (isForCurrentChat && isFromAnotherUser) {
        setMessages(prev => {
          if (prev.some(msg => msg._id === incomingMessage._id)) return prev;
          return [...prev, incomingMessage];
        });
      }
    };

    const handleTyping = (data: { conversationId: string; isTyping: boolean; firstName: string; }) => {
       if (data.conversationId === currentConversation?._id) {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u !== data.firstName), data.firstName]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== data.firstName));
        }
      }
    };
    const handleConversationRead = (data: { conversationId: string, userId: string }) => {
      if (data.conversationId === currentConversation?._id) {
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (!msg.readBy.some(r => r.userId === data.userId)) {
              return {
                ...msg,
                readBy: [...msg.readBy, { userId: data.userId, readAt: new Date().toISOString() }]
              };
            }
            return msg;
          })
        );
      }
    };

    const handleReactionUpdate = (data: { messageId: string, reactions: Reaction[] }) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg._id === data.messageId) {
            return { ...msg, reactions: data.reactions };
          }
          return msg;
        })
      );
    };

    socket.on('reactionUpdated', handleReactionUpdate);
    socket.on('newChatMessage', handleNewMessage);
    socket.on('userChatTyping', handleTyping);
    socket.on('conversationRead', handleConversationRead);

    return () => {
      socket.off('newChatMessage', handleNewMessage);
      socket.off('userChatTyping', handleTyping);
      socket.off('conversationRead', handleConversationRead);
      socket.off('reactionUpdated', handleReactionUpdate);
    };
  }, [socket, currentUser, currentConversation, updateConversationLastMessage]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!currentConversation || !socket || !currentUser) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${backendUrl}/api/chat/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'File upload failed');
      }
      
      const messageType = data.metadata.mimeType.startsWith('image/') ? 'image' : 'file';

      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        conversationId: currentConversation._id,
        senderId: currentUser,
        content: data.url,
        messageType: messageType,
        createdAt: new Date().toISOString(),
        metadata: data.metadata,
        readBy: [],
      };
      setMessages(prev => [...prev, optimisticMessage]);

      socket.emit('sendChatMessage', {
        conversationId: currentConversation._id,
        content: data.url,
        messageType: messageType,
        metadata: data.metadata
      });

    } catch (error) {
        console.error('Upload error:', error);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/conversations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false); 
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`${backendUrl}/api/messages/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      } else {
        console.error('Failed to load messages:', data.message);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    if (currentConversation?._id === conversation._id) return;
    
    if (socket && currentConversation) {
      socket.emit('leaveConversation', { conversationId: currentConversation._id });
    }
    
    setCurrentConversation(conversation);
    setMessages([]);
    setTypingUsers([]);
    
    if (socket) {
      socket.emit('joinConversation', { conversationId: conversation._id });
      loadMessages(conversation._id);
      
      if (conversation.unreadCount > 0) {
        socket.emit('markConversationRead', { conversationId: conversation._id });
        setConversations(prev => prev.map(c => 
          c._id === conversation._id ? { ...c, unreadCount: 0 } : c
        ));
      }
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !currentConversation || !socket || !currentUser) return;

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: currentConversation._id,
      senderId: currentUser,
      content: text.trim(),
      messageType: 'text',
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    setMessages(prev => [...prev, optimisticMessage]);

    const messageData = {
      conversationId: currentConversation._id,
      content: text.trim(),
      messageType: 'text'
    };
    socket.emit('sendChatMessage', messageData);

    setMessageInput('');
    stopTyping();
  };

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setMessageInput(e.target.value);
    
  //   if (!isTyping && currentConversation && socket) {
  //     setIsTyping(true);
  //     socket.emit('chatTyping', { conversationId: currentConversation._id, isTyping: true });
  //   }

  //   if (typingTimeoutRef.current) {
  //     clearTimeout(typingTimeoutRef.current);
  //   }

  //   typingTimeoutRef.current = setTimeout(() => {
  //     stopTyping();
  //   }, 1000);
  // };

  const stopTyping = () => {
    if (isTyping && currentConversation && socket) {
      setIsTyping(false);
      socket.emit('chatTyping', { conversationId: currentConversation._id, isTyping: false });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCreateConversation = async (type: 'direct' | 'group', participants: string[], title?: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, participants, title })
      });
      
      const data = await response.json();
      if (data.success) {
        setConversations(prev => [data.conversation, ...prev.filter(c => c._id !== data.conversation._id)]);
        selectConversation(data.conversation);
      } else {
        console.error('Failed to create conversation:', data.message);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };
  
  // UPDATED: Function to handle leaving a conversation
  const handleLeaveConversation = async (conversationId: string) => {
    const conversation = conversations.find(c => c._id === conversationId);
    const isGroup = conversation?.type === 'group';

    const confirmMessage = isGroup
      ? 'Are you sure you want to leave this group?'
      : 'Are you sure you want to hide this conversation from your list?';
      
    if (!window.confirm(confirmMessage)) {
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/api/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) {
            // Remove the conversation from the UI
            setConversations(prev => prev.filter(c => c._id !== conversationId));
            // If the conversation was active, clear the chat window
            if (currentConversation?._id === conversationId) {
                setCurrentConversation(null);
                setMessages([]);
            }
        } else {
            console.error('Failed to leave conversation:', data.message);
            alert(`Failed to leave conversation: ${data.message}`);
        }
    } catch (error) {
        console.error('Error leaving conversation:', error);
        alert('An error occurred while trying to leave the conversation.');
    }
  };

  // Handlers for the options menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversation: Conversation) => {
    event.stopPropagation(); // Prevents ListItemButton click
    setMenuAnchorEl(event.currentTarget);
    setSelectedConversationForMenu(conversation);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedConversationForMenu(null);
  };


  const getConversationTitle = (conversation: Conversation) => {
    if (!currentUser) return 'Loading...';

    if (conversation.type === 'group') {
      return conversation.title || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants?.find(
      p => p.userId && p.userId._id !== currentUser._id
    );
    
    if (otherParticipant?.userId) {
      return `${otherParticipant.userId.firstName} ${otherParticipant.userId.lastName}`;
    }
    
    return 'Direct Message';
  };

  const getAvatarContent = (conversation: Conversation) => {
    if (!currentUser) return <PersonIcon />;
    
    if (conversation.type === 'group') {
      return <GroupIcon />;
    }
    
    const otherParticipant = conversation.participants?.find(
      p => p.userId && p.userId._id !== currentUser._id
    );
    
    if (otherParticipant?.userId) {
      const { firstName, lastName } = otherParticipant.userId;
      return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    }
    
    return <PersonIcon />;
  };
  
  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
      <Paper
        elevation={8}
        sx={{
          height: '100%',
          display: 'flex',
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 0.5
        }}
      >
        {/* Sidebar */}
        <Paper
          sx={{
            width: 380,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Sidebar Header */}
          <AppBar 
            position="static" 
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '8px 8px 0 0'
            }}
          >
            <Toolbar>
              <ChatIcon sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div">
                  Chat
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircleIcon 
                    sx={{ 
                      fontSize: 8, 
                      mr: 1, 
                      color: isConnected ? '#4ade80' : '#ef4444' 
                    }} 
                  />
                  <Typography variant="caption">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Start new chat">
                <IconButton 
                  color="inherit" 
                  onClick={() => setShowNewChatDialog(true)}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>

          {/* Conversations List */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ p: 1 }}>
                {conversations.map((conversation, index) => (
                  <Slide key={conversation._id} direction="right" in timeout={300 + index * 100}>
                    <Box sx={{ position: 'relative', '&:hover .conversation-menu-button': { opacity: 1 } }}>
                      <ListItemButton
                        onClick={() => selectConversation(conversation)}
                        selected={currentConversation?._id === conversation._id}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          pr: 6, // Add padding to the right to make space for the button
                          '&.Mui-selected': {
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            '& .MuiListItemText-primary': { color: 'white' },
                            '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' }
                          },
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge 
                            badgeContent={conversation.unreadCount} 
                            color="error"
                            invisible={conversation.unreadCount === 0}
                          >
                            <Avatar
                              src={getAvatarUrl(conversation)}
                              sx={{
                                background: conversation.type === 'group' 
                                  ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                                  : 'linear-gradient(135deg, #4ecdc4, #44a08d)'
                              }}
                            >
                              {getAvatarContent(conversation)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getConversationTitle(conversation)}
                          secondary={
                            conversation.lastMessage?.content || 'No messages yet'
                          }
                          primaryTypographyProps={{ fontWeight: 600 }}
                          secondaryTypographyProps={{ 
                            noWrap: true,
                            sx: { maxWidth: 200 }
                          }}
                        />
                      </ListItemButton>
                      <Tooltip title="More options">
                        <IconButton
                            className="conversation-menu-button"
                            size="small"
                            onClick={(e) => handleMenuOpen(e, conversation)}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: currentConversation?._id === conversation._id ? 'white' : 'text.secondary',
                                backgroundColor: 'action.hover',
                                '&:hover': {
                                    backgroundColor: 'action.selected',
                                },
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Slide>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        {/* Chat Area (No changes here) */}
        {/* ... */}
        <Paper
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            ml: 0.5,
            overflow: 'hidden'
          }}
        >
          {/* Chat Header */}
          <AppBar 
            position="static" 
            elevation={0}
            color="inherit"
            sx={{
              borderRadius: '8px 8px 0 0',
              background: alpha(theme.palette.grey[100], 0.8),
              backdropFilter: 'blur(10px)'
            }}
          >
            <Toolbar>
              {currentConversation ? (
                <>
                  <Avatar 
                    sx={{ mr: 2 }}
                    src={getAvatarUrl(currentConversation)} 
                  >
                    {getAvatarContent(currentConversation)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" color="text.primary">
                      {getConversationTitle(currentConversation)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentConversation.participants.length} participants
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" color="text.primary">
                    Select a conversation
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Choose a chat to start messaging
                  </Typography>
                </Box>
              )}
            </Toolbar>
          </AppBar>

          {/* Messages Area */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              background: `linear-gradient(180deg, 
                ${alpha(theme.palette.background.paper, 0.9)} 0%, 
                ${alpha(theme.palette.grey[50], 0.9)} 100%)`
            }}
          >
            {loadingMessages ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : !currentConversation ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <Box>
                  <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h4" gutterBottom>
                    Welcome to Trippy.lol Chat! 🚀
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Select a conversation from the sidebar to start chatting
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isCurrentUser = message.senderId?._id === currentUser?._id;

                  const messageContent = () => {
                    if (message.messageType === 'image') {
                      return (
                        <Box
                          component="img"
                          src={message.content}
                          alt={message.metadata?.fileName || 'User upload'}
                          sx={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', cursor: 'pointer' }}
                          onClick={() => window.open(message.content, '_blank')}
                        />
                      );
                    }
                    if (message.messageType === 'file') {
                      return (
                        <Button
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          href={message.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          {message.metadata?.fileName || 'Download File'}
                        </Button>
                      );
                    }
                    return <Typography variant="body1">{message.content}</Typography>;
                  };

                  const ReadReceipt = () => {
                    if (!isCurrentUser) return null;
                    const otherParticipant = currentConversation?.participants.find(p => p.userId._id !== currentUser?._id);
                    if (!otherParticipant) return <DoneIcon sx={{ fontSize: 16, ml: 0.5, opacity: 0.7 }} />;
                    const isRead = message.readBy.some(r => r.userId === otherParticipant.userId._id);
                    if (isRead) return <DoneAllIcon sx={{ fontSize: 16, ml: 0.5, color: '#64b5f6' }} />;
                    return <DoneIcon sx={{ fontSize: 16, ml: 0.5, opacity: 0.7 }} />;
                  };

                  const RenderReactions = () => {
                    if (!message.reactions || message.reactions.length === 0) return null;

                    const reactionGroups = message.reactions.reduce((acc, reaction) => {
                      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <Box 
                        sx={{
                          display: 'flex', 
                          gap: 0.75,
                          flexWrap: 'wrap',
                          mt: 0.75,
                          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {Object.entries(reactionGroups).map(([emoji, count]) => {
                          const userHasReacted = message.reactions?.some(
                            r => r.userId === currentUser?._id && r.emoji === emoji
                          );
                          
                          return (
                            <Chip
                              key={emoji}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height:'20px' }}>
                                  <span style={{ fontSize: '16px' }}>{emoji}</span>
                                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{count}</span>
                                </Box>
                              }
                              size="medium"
                              variant={userHasReacted ? "filled" : "outlined"}
                              onClick={() => {
                                if (socket && message._id) {
                                  socket.emit('toggleReaction', { messageId: message._id, emoji });
                                }
                              }}
                              sx={{
                                cursor: 'pointer',
                                height: 32,
                                minWidth: 48,
                                fontSize: '0.875rem',
                                backgroundColor: userHasReacted 
                                  ? 'rgba(102, 126, 234, 0.15)' 
                                  : 'background.paper',
                                color: userHasReacted 
                                  ? 'primary.main' 
                                  : 'text.primary',
                                border: '1.5px solid',
                                borderColor: userHasReacted 
                                  ? 'primary.main' 
                                  : 'divider',
                                '&:hover': {
                                  backgroundColor: userHasReacted 
                                    ? 'rgba(102, 126, 234, 0.25)' 
                                    : 'action.hover',
                                  transform: 'scale(1.05)',
                                  borderColor: 'primary.main',
                                },
                                transition: 'all 0.2s ease',
                                '& .MuiChip-label': { 
                                  paddingTop: '12px !important',
                                  paddingBottom: '8px !important',
                                  paddingLeft: '7px !important',
                                  paddingRight: '0px !important',
                                  fontSize: '0.875rem',
                                  lineHeight: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  height: '100%',
                                }
                              }}
                            />
                          );
                        })}
                      </Box>
                    );
                  };

                  return (
                    <Fade key={message._id} in={true} timeout={300 + index * 50}>
                      <Box 
                        sx={{ 
                          mb: 2,
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <Box
                          className="message-wrapper"
                          sx={{
                            position: 'relative',
                            maxWidth: '60%',
                            '&:hover .reaction-button': {
                              opacity: 1
                            }
                          }}
                        >
                          <IconButton
                            className="reaction-button"
                            size="small"
                            onClick={(e) => {
                              setReactionPickerAnchor(e.currentTarget);
                              setActiveMessageId(message._id);
                            }}
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: isCurrentUser ? -4 : 'auto',
                              left: isCurrentUser ? 'auto' : -4,
                              zIndex: 10,
                              width: 28,
                              height: 28,
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(4px)',
                              border: '1px solid',
                              borderColor: 'divider',
                              opacity: 0,
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                backgroundColor: 'rgba(255, 255, 255, 1)',
                                transform: 'scale(1.1)',
                                boxShadow: 2
                              }
                            }}
                          >
                            <TagFacesIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Paper 
                            elevation={1}
                            sx={{
                              p: message.messageType === 'image' ? 0.5 : 2,
                              borderRadius: 3,
                              ...(isCurrentUser
                                ? { 
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                                    color: 'white', 
                                    borderBottomRightRadius: 8 
                                  }
                                : { 
                                    backgroundColor: theme.palette.grey[100], 
                                    borderBottomLeftRadius: 8 
                                  })
                            }}
                          >
                            {messageContent()}
                          
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', 
                              mt: message.messageType === 'text' ? 0.5 : 0,
                              p: message.messageType === 'image' ? '4px 8px' : 0 
                            }}>
                              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                {formatTime(message.createdAt)}
                              </Typography>
                              <ReadReceipt />
                            </Box>
                          </Paper>
                        </Box>
                        <RenderReactions />
                      </Box>
                    </Fade>
                  );
                })} 

                {typingUsers.length > 0 && (
                  <Fade in>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                      <Chip
                        label={`${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          fontStyle: 'italic',
                          animation: 'pulse 1.5s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 0.6 },
                            '50%': { opacity: 1 }
                          }
                        }}
                      />
                    </Box>
                  </Fade>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box
              component="form"
              onSubmit={(e) => { e.preventDefault(); sendMessage(messageInput); }}
              sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
            >
            <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Tooltip title="Attach file">
                  <span>
                    <IconButton onClick={() => fileInputRef.current?.click()} disabled={!currentConversation || isUploading}>
                      {isUploading ? <CircularProgress size={24} /> : <AttachFileIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={!currentConversation || !currentUser || isUploading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(messageInput);
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)'
                    }
                  }}
                />
                <Tooltip title="Send message">
                  <span>
                    <IconButton
                      type="submit"
                      disabled={!currentConversation || !messageInput.trim() || isUploading}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        '&:hover': { background: 'linear-gradient(135deg, #5a67d8, #6b46c1)' },
                        '&:disabled': { background: theme.palette.grey[300] },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </span>
                </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Paper>
      <NewChatDialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        onCreateConversation={handleCreateConversation}
      />
      <Popover
        open={Boolean(reactionPickerAnchor) && Boolean(activeMessageId)}
        anchorEl={reactionPickerAnchor}
        onClose={() => {
          setReactionPickerAnchor(null);
          setActiveMessageId(null);
        }}
        anchorOrigin={{ 
          vertical: 'top', 
          horizontal: 'center' 
        }}
        transformOrigin={{ 
          vertical: 'bottom', 
          horizontal: 'center' 
        }}
        slotProps={{
          paper: {
            sx: {
              boxShadow: 4,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'visible',
              mt: -1
            }
          }
        }}
        disableScrollLock
        disableRestoreFocus
        disableEnforceFocus
      >
        <Box sx={{ 
          p: 1,
          backgroundColor: 'background.paper',
          borderRadius: 2
        }}>
          <EmojiPicker 
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={true}
            previewConfig={{
              showPreview: false
            }}
          />
        </Box>
      </Popover>  

      {/* UPDATED: Conversation options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
            elevation: 2,
            sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
            },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            if (selectedConversationForMenu) {
              handleLeaveConversation(selectedConversationForMenu._id); // Updated function call
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" /> {/* Updated Icon */}
          </ListItemIcon>
          <ListItemText primary="Leave Chat" /> {/* Updated Text */}
        </MenuItem>
      </Menu>
    </Container>
    
  );
};

export default ChatInterface;
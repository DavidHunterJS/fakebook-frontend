// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/router';
// import {
//   Paper,
//   Box,
//   Typography,
//   Grid,
//   CircularProgress,
//   Alert,
//   Avatar,
//   Button,
// } from '@mui/material';
// import { Person as PersonIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';

// // --- Assumed correct paths ---
// import useAuth from '../../../hooks/useAuth';
// import api from '../../../utils/api';
// import { getFullImageUrl } from '../../../utils/imgUrl';
// import FollowButton from '../../../components/follow/FollowButton';
// import SuggestedUsers from '../../../components/follow/SuggestedUsers';

// // --- Type definitions ---
// interface User {
//   _id: string;
//   username: string;
//   firstName: string;
//   lastName: string;
//   profilePicture?: string;
//   following?: string[];
// }
// type PotentialFriend = {
//   user?: FriendUser;
//   profile?: FriendUser;
//   friend?: FriendUser;
// } & Partial<FriendUser>;

// interface FriendUser extends User {
//   isFollowing?: boolean;
// }

// interface Profile extends User {
//   _id: string;
//   // Ensure friends can be strings (IDs) or objects
//   friends?: (string | FriendUser)[]; 
//   firstName: string;
// }

// interface ApiError {
//   response?: {
//     data?: {
//       message?: string;
//     };
//   };
//   message?: string;
// }

// // --- Component Props ---
// interface FriendsTabProps {
//   profile: Profile;
//   isOwnProfile: boolean;
//   onDebugMessage: (message: string) => void;
// }

// const FriendsTab: React.FC<FriendsTabProps> = ({ profile, isOwnProfile }) => {
//   const router = useRouter();
//   const { user: currentUser, isAuthenticated } = useAuth();
  
//   const [friends, setFriends] = useState<FriendUser[]>([]);
//   const [loadingFriends, setLoadingFriends] = useState(true);
//   const [friendsError, setFriendsError] = useState<string | null>(null);

//   // --- STABLE DEPENDENCY FIX: useCallback now uses primitive values ---
//   const fetchFriends = useCallback(async () => {
//     // Check for the profile ID, which is a stable primitive value
//     if (!profile?._id) {
//       console.log('[FriendsTab] No profile ID available, skipping fetch.');
//       setLoadingFriends(false);
//       return;
//     }

//     console.log(`[FriendsTab] Starting fetch for profile ID: ${profile._id}`);
//     setLoadingFriends(true);
//     setFriendsError(null);

//     try {
//       // Assuming your API call for friends is now working correctly
//       const endpoint = isOwnProfile ? '/friends' : `/users/${profile._id}/friends`;
//       const response = await api.get(endpoint);

//       let friendsData: FriendUser[] = [];
//       const potentialFriends = response?.data?.friends || (Array.isArray(response.data) ? response.data : []);

//       // Ensure we unwrap the friend object if it's nested (e.g., { user: {...} })
//       friendsData = potentialFriends.map((f: PotentialFriend) => f.user || f.profile || f.friend || f);

//       // Add following status
//       if (currentUser && friendsData.length > 0) {
//         const friendsWithStatus = friendsData.map((friend) => ({
//           ...friend,
//           isFollowing: currentUser.following?.some(id => String(id) === String(friend._id)) || false,
//         }));
//         setFriends(friendsWithStatus);
//       } else {
//         setFriends(friendsData);
//       }
//     } catch (err) {
//       const error = err as ApiError;
//       const errMsg = error.response?.data?.message || error.message || 'Failed to load friends.';
//       console.error('Error fetching friends:', error);
//       setFriendsError(errMsg);
//     } finally {
//       setLoadingFriends(false);
//     }
//   //
//   // THE FIX: Use primitive values from objects instead of the whole objects.
//   // `currentUser` is an object, so we use `currentUser?._id` if needed, but in this case,
//   // we can just pass the whole object and assume the auth hook provides a stable reference.
//   // The most critical one to fix was `profile`.
//   //
//   }, [profile?._id, isOwnProfile, currentUser]); 

//   // --- SIMPLIFIED USEEFFECT: This is all you need now ---
//   // It will run once when the component mounts, and again ONLY if the profile ID changes.
//   useEffect(() => {
//     fetchFriends();
//   }, [fetchFriends]);


//   const handleFollowChange = (friendId: string, newState: boolean) => {
//     setFriends(prevFriends =>
//       prevFriends.map(f =>
//         f._id === friendId ? { ...f, isFollowing: newState } : f
//       )
//     );
//   };
  
//   if (loadingFriends) {
//     return (
//       <Paper sx={{ p: 4, borderRadius: 2, mb: 3, textAlign: 'center' }}>
//         <CircularProgress />
//         <Typography sx={{ mt: 2 }}>Loading friends...</Typography>
//       </Paper>
//     );
//   }

//   return (
//     <>
//       <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 3 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//           <Typography variant="h5">
//             Friends {friends.length > 0 && `(${friends.length})`}
//           </Typography>
//         </Box>

//         {friendsError && (
//           <Alert severity="error" sx={{ mb: 3 }}>{friendsError}</Alert>
//         )}

//         {friends.length > 0 ? (
//           <Grid container spacing={2}>
//             {friends.map((friend) => (
//               <Grid size={{xs:12,sm:6,md:4}}

//                 key={friend._id}
//               >
//                 <Paper
//                   variant="outlined"
//                   sx={{
//                     p: 2, 
//                     display: 'flex', 
//                     flexDirection: 'column', 
//                     alignItems: 'center', 
//                     height: '100%',
//                     transition: 'transform 0.2s, box-shadow 0.2s',
//                     '&:hover': { 
//                       transform: 'translateY(-4px)', 
//                       boxShadow: 3 
//                     }
//                   }}
//                 >
//                   <Avatar
//                     src={getFullImageUrl(friend.profilePicture, 'profile')}
//                     alt={friend.username}
//                     sx={{ width: 80, height: 80, mb: 1, cursor: 'pointer' }}
//                     onClick={() => router.push(`/profile/${friend._id}`)}
//                   />
//                   <Typography
//                     variant="subtitle1" 
//                     align="center"
//                     sx={{ fontWeight: 'bold', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
//                     onClick={() => router.push(`/profile/${friend._id}`)}
//                   >
//                     {friend.firstName} {friend.lastName}
//                   </Typography>
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//                     @{friend.username}
//                   </Typography>
                  
//                   {isAuthenticated && currentUser?._id !== friend._id && (
//                     <FollowButton
//                       userId={friend._id}
//                       initialFollowState={friend.isFollowing}
//                       onFollowChange={(newState) => handleFollowChange(friend._id, newState)}
//                       size="small" 
//                       variant="outlined" 
//                       showIcon={false} 
//                     />
//                   )}
//                 </Paper>
//               </Grid>
//             ))}
//           </Grid>
//         ) : (
//           <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
//             <PersonIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
//             <Typography variant="h6" color="text.secondary">
//               {isOwnProfile ? 'You have no friends yet' : `${profile.firstName} has no friends to display.`}
//             </Typography>
//             {isOwnProfile && (
//               <Button
//                 variant="contained" 
//                 startIcon={<PersonAddIcon />} 
//                 sx={{ mt: 2 }}
//                 onClick={() => router.push('/friends/find')}
//               >
//                 Find Friends
//               </Button>
//             )}
//           </Box>
//         )}
//       </Paper>

//       {isOwnProfile && (
//         <SuggestedUsers 
//           limit={12} 
//           showTitle={true} 
//           layout="vertical" 
//         />
//       )}
//     </>
//   );
// };

// export default FriendsTab;
// import React from 'react';
// import { useRouter } from 'next/router';
// import {
//   Box,
//   Typography,
//   Paper,
//   Button,
//   CircularProgress,
// } from '@mui/material';
// import { User } from '../../../types/user'; // Adjust path as needed
// import { Post } from '../../../types/post'; // Adjust path as needed
// import PostCard from '../../../components/post/PostCard'; // Adjust path as needed

// // Interface for profile data - extends User type
// interface Profile extends User {
//   bio?: string;
//   followers?: string[];
//   following?: string[];
//   recentPosts?: Post[];
//   relationshipStatus?: {
//     isOwnProfile?: boolean;
//     isFriend?: boolean;
//     hasSentRequest?: boolean;
//     hasReceivedRequest?: boolean;
//     isFollowing?: boolean;
//   };
//   friendCount?: number;
//   mutualFriends?: User[];
//   privacyRestricted?: boolean;
//   // Additional fields
//   location?: string;
//   birthday?: string;
//   joinedDate?: string;
//   education?: string;
//   work?: string;
//   website?: string;
//   phone?: string;
//   friends?: User[];
//   followersCount?: number;
//   followingCount?: number;
//   profilePicture?: string;
//   coverPhoto?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// interface PostsTabProps {
//   profile: Profile;
//   isOwnProfile: boolean;
//   userPostsData: Post[];
//   userPostsLoading: boolean;
//   onDebugMessage?: (message: string) => void;
// }

// const PostsTab: React.FC<PostsTabProps> = ({
//   profile,
//   isOwnProfile,
//   userPostsData,
//   userPostsLoading,
// }) => {
//   const router = useRouter();

//   if (!profile) {
//     return null;
//   }

//   return (
//     <>
//       {userPostsLoading ? (
//         <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//           <CircularProgress />
//         </Box>
//       ) : userPostsData.length > 0 ? (
//         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
//           {/* Left Sidebar - Intro */}
//           <Box sx={{ width: { xs: '100%', md: '33.33%' }, order: { xs: 2, md: 1 } }}>
//             <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 80 }}>
//               <Typography variant="h6" gutterBottom>
//                 Intro
//               </Typography>
              
//               {/* Bio Section */}
//               {profile.bio ? (
//                 <Typography variant="body2" sx={{ mb: 2 }}>
//                   {profile.bio}
//                 </Typography>
//               ) : (
//                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//                   No bio available
//                 </Typography>
//               )}

//               {/* Additional Profile Info */}
//               <Box sx={{ mb: 2 }}>
//                 {profile.location && (
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//                     📍 {profile.location}
//                   </Typography>
//                 )}
                
//                 {profile.work && (
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//                     💼 {profile.work}
//                   </Typography>
//                 )}
                
//                 {profile.education && (
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//                     🎓 {profile.education}
//                   </Typography>
//                 )}

//                 {profile.website && (
//                   <Typography 
//                     variant="body2" 
//                     color="primary.main" 
//                     component="a" 
//                     href={profile.website} 
//                     target="_blank" 
//                     rel="noopener noreferrer"
//                     sx={{ 
//                       textDecoration: 'none', 
//                       '&:hover': { textDecoration: 'underline' },
//                       display: 'block',
//                       mb: 1
//                     }}
//                   >
//                     🌐 {profile.website}
//                   </Typography>
//                 )}

//                 {profile.createdAt && (
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//                     📅 Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { 
//                       month: 'long', 
//                       year: 'numeric' 
//                     })}
//                   </Typography>
//                 )}
//               </Box>

//               {/* Stats Section */}
//               <Box sx={{ mb: 2 }}>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                   <Typography variant="body2" color="text.secondary">
//                     Posts
//                   </Typography>
//                   <Typography variant="body2" fontWeight="bold">
//                     {userPostsData.length}
//                   </Typography>
//                 </Box>
                
//                 {(profile.followersCount !== undefined || profile.followers?.length !== undefined) && (
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                     <Typography variant="body2" color="text.secondary">
//                       Followers
//                     </Typography>
//                     <Typography variant="body2" fontWeight="bold">
//                       {profile.followersCount || profile.followers?.length || 0}
//                     </Typography>
//                   </Box>
//                 )}
                
//                 {(profile.followingCount !== undefined || profile.following?.length !== undefined) && (
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                     <Typography variant="body2" color="text.secondary">
//                       Following
//                     </Typography>
//                     <Typography variant="body2" fontWeight="bold">
//                       {profile.followingCount || profile.following?.length || 0}
//                     </Typography>
//                   </Box>
//                 )}

//                 {profile.friends?.length !== undefined && (
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                     <Typography variant="body2" color="text.secondary">
//                       Friends
//                     </Typography>
//                     <Typography variant="body2" fontWeight="bold">
//                       {profile.friends.length}
//                     </Typography>
//                   </Box>
//                 )}
//               </Box>

//               {/* Edit Profile Button */}
//               {isOwnProfile && (
//                 <Button 
//                   fullWidth 
//                   variant="outlined" 
//                   sx={{ mt: 2 }} 
//                   onClick={() => router.push('/settings/profile')}
//                 >
//                   Edit Details
//                 </Button>
//               )}
//             </Paper>
//           </Box>

//           {/* Right Content - Posts */}
//           <Box sx={{ width: { xs: '100%', md: '66.67%' }, order: { xs: 1, md: 2 } }}>
//             {userPostsData.map((post) => (
//               <PostCard key={post._id} post={post} />
//             ))}
//           </Box>
//         </Box>
//       ) : (
//         <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
//           <Typography variant="body1" color="text.secondary">
//             No posts to display.
//           </Typography>
//           {isOwnProfile && (
//             <Button 
//               variant="contained" 
//               sx={{ mt: 2 }}
//               onClick={() => router.push('/dashboard')}
//             >
//               Create Your First Post
//             </Button>
//           )}
//         </Paper>
//       )}
//     </>
//   );
// };

// export default PostsTab;
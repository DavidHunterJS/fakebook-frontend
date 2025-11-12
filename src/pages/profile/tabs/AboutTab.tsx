// import React, { useState, useCallback } from 'react';
// import {
//   Box,
//   Typography,
//   Paper,
//   Button,
//   TextField,
//   Alert,
//   CircularProgress,
// } from '@mui/material';
// import { Edit as EditIcon } from '@mui/icons-material';
// import { User } from '../../../types/user'; 
// import api from '../../../utils/api'; 
// import { Post } from '@/types/post';

// // Interface for profile data - extends User type
// interface Profile extends User {
//   bio?: string;
//   followers?: string[];
//   following?: string[];
//   recentPosts?: Post[]; // You might want to import Post type if needed
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
//   // Additional fields for About tab
//   location?: string;
//   birthday?: string;
//   joinedDate?: string;
//   education?: string;
//   work?: string;
//   website?: string;
//   phone?: string;
//   // Friends data
//   friends?: User[];
//   // Follow system counts
//   followersCount?: number;
//   followingCount?: number;
//   // Profile/cover photos
//   profilePicture?: string;
//   coverPhoto?: string;
//   // Timestamps
//   createdAt?: string;
//   updatedAt?: string;
// }

// interface AboutTabProps {
//   profile: Profile;
//   isOwnProfile: boolean;
//   onProfileUpdate: (updatedProfile: Partial<Profile>) => void;
//   onDebugMessage?: (message: string) => void;
// }

// interface ApiError {
//   response?: {
//     data?: {
//       message?: string;
//     };
//     status?: number;
//   };
//   config?: {
//     url?: string;
//   };
//   message?: string;
// }

// const AboutTab: React.FC<AboutTabProps> = ({
//   profile,
//   isOwnProfile,
//   onProfileUpdate,
//   onDebugMessage
// }) => {
//   // Bio editing state
//   const [isEditingBio, setIsEditingBio] = useState(false);
//   const [bioValue, setBioValue] = useState(profile?.bio || '');
//   const [savingBio, setSavingBio] = useState(false);
//   const [bioError, setBioError] = useState<string | null>(null);

//   // Basic info editing state
//   const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
//   const [basicInfoValues, setBasicInfoValues] = useState({
//     firstName: profile?.firstName || '',
//     lastName: profile?.lastName || '',
//     location: profile?.location || ''
//   });
//   const [savingBasicInfo, setSavingBasicInfo] = useState(false);
//   const [basicInfoError, setBasicInfoError] = useState<string | null>(null);

//   // Work and Education editing state
//   const [isEditingWorkEdu, setIsEditingWorkEdu] = useState(false);
//   const [workEduValues, setWorkEduValues] = useState({
//     work: profile?.work || '',
//     education: profile?.education || ''
//   });
//   const [savingWorkEdu, setSavingWorkEdu] = useState(false);
//   const [workEduError, setWorkEduError] = useState<string | null>(null);

//   // API request helper
//   const makeApiRequest = useCallback(async (url: string, method: 'get' | 'post' | 'put' | 'delete' = 'get', data?: unknown) => {
//     const addDebug = (msg: string) => {
//       console.log(msg);
//       onDebugMessage?.(msg);
//     };
    
//     addDebug(`Attempting ${method.toUpperCase()} request to relative path: ${url}`);
//     try {
//       let response;
//       switch(method) {
//         case 'post': response = await api.post(url, data); break;
//         case 'put': response = await api.put(url, data); break;
//         case 'delete': response = await api.delete(url); break;
//         case 'get':
//         default: response = await api.get(url); break;
//       }
//       addDebug(`API request succeeded. Full URL: ${response.config.url}`);
//       return response;
//     } catch (err: unknown) {
//       const error = err as ApiError;
//       const fullUrl = error.config?.url;
//       const errMsg = error.response?.data?.message || error.message || 'API request failed';
//       const status = error.response?.status || 'No Status';
//       addDebug(`API request failed. Full URL: ${fullUrl || url} - Status: ${status}, Message: ${errMsg}`);
//       if (error.response?.data) {
//         addDebug(`Error Response Body: ${JSON.stringify(error.response.data)}`);
//       }
//       throw error;
//     }
//   }, [onDebugMessage]);

//   // Handle bio save
//   const handleSaveBio = useCallback(async () => {
//     if (!profile) return;
//     setSavingBio(true);
//     setBioError(null);
//     try {
//       await makeApiRequest('/users/profile', 'put', { bio: bioValue });
//       onDebugMessage?.(`Bio updated successfully to: ${bioValue}`);
//       onProfileUpdate({ bio: bioValue });
//       setIsEditingBio(false);
//     } catch (error: unknown) {
//       const err = error as ApiError;
//       console.error('Error updating bio:', err);
//       setBioError(err.response?.data?.message || err.message || 'Failed to update bio.');
//       onDebugMessage?.(`Error updating bio: ${err.response?.data?.message || err.message || 'Failed to update bio.'}`);
//     } finally {
//       setSavingBio(false);
//     }
//   }, [profile, bioValue, makeApiRequest, onProfileUpdate, onDebugMessage]);

//   // Handle cancel bio edit
//   const handleCancelEditBio = useCallback(() => {
//     setIsEditingBio(false);
//     setBioValue(profile?.bio || '');
//     setBioError(null);
//   }, [profile]);

//   // Handle save basic info
//   const handleSaveBasicInfo = useCallback(async () => {
//     if (!profile) return;
//     setSavingBasicInfo(true);
//     setBasicInfoError(null);
//     try {
//       await makeApiRequest('/users/profile', 'put', basicInfoValues);
//       onDebugMessage?.(`Basic info updated successfully: ${JSON.stringify(basicInfoValues)}`);
//       onProfileUpdate(basicInfoValues);
//       setIsEditingBasicInfo(false);
//     } catch (error: unknown) {
//       const err = error as ApiError;
//       console.error('Error updating basic info:', err);
//       setBasicInfoError(err.response?.data?.message || err.message || 'Failed to update information.');
//       onDebugMessage?.(`Error updating basic info: ${err.response?.data?.message || err.message || 'Failed to update information.'}`);
//     } finally {
//       setSavingBasicInfo(false);
//     }
//   }, [profile, basicInfoValues, makeApiRequest, onProfileUpdate, onDebugMessage]);

//   // Handle cancel basic info edit
//   const handleCancelEditBasicInfo = useCallback(() => {
//     setIsEditingBasicInfo(false);
//     if (profile) {
//       setBasicInfoValues({
//         firstName: profile.firstName || '',
//         lastName: profile.lastName || '',
//         location: profile.location || ''
//       });
//     }
//     setBasicInfoError(null);
//   }, [profile]);

//   // Handle save work and education
//   const handleSaveWorkEdu = useCallback(async () => {
//     if (!profile) return;
//     setSavingWorkEdu(true);
//     setWorkEduError(null);
//     try {
//       await makeApiRequest('/users/profile', 'put', workEduValues);
//       onDebugMessage?.(`Work and education updated successfully: ${JSON.stringify(workEduValues)}`);
//       onProfileUpdate(workEduValues);
//       setIsEditingWorkEdu(false);
//     } catch (error: unknown) {
//       const err = error as ApiError;
//       console.error('Error updating work and education:', err);
//       setWorkEduError(err.response?.data?.message || err.message || 'Failed to update work and education.');
//       onDebugMessage?.(`Error updating work and education: ${err.response?.data?.message || err.message || 'Failed to update work and education.'}`);
//     } finally {
//       setSavingWorkEdu(false);
//     }
//   }, [profile, workEduValues, makeApiRequest, onProfileUpdate, onDebugMessage]);

//   // Handle cancel work and education edit
//   const handleCancelEditWorkEdu = useCallback(() => {
//     setIsEditingWorkEdu(false);
//     if (profile) {
//       setWorkEduValues({
//         work: profile.work || '',
//         education: profile.education || ''
//       });
//     }
//     setWorkEduError(null);
//   }, [profile]);

//   // Update local state when profile prop changes
//   React.useEffect(() => {
//     if (profile) {
//       setBioValue(profile.bio || '');
//       setBasicInfoValues({
//         firstName: profile.firstName || '',
//         lastName: profile.lastName || '',
//         location: profile.location || ''
//       });
//       setWorkEduValues({
//         work: profile.work || '',
//         education: profile.education || ''
//       });
//     }
//   }, [profile]);

//   if (!profile) {
//     return null;
//   }

//   return (
//     <Paper sx={{ p: 4, borderRadius: 2 }}>
//       <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
//         <Box sx={{ width: { xs: '100%', md: '30%' } }}>
//           <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
//             About
//           </Typography>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
//             {/* Navigation buttons for About sections */}
//             <Button 
//               variant="text" 
//               sx={{ 
//                 justifyContent: 'flex-start', 
//                 px: 2, 
//                 py: 1, 
//                 borderRadius: 1, 
//                 '&:hover': { bgcolor: 'action.hover' }, 
//                 bgcolor: 'action.selected' 
//               }}
//             >
//               Overview
//             </Button>
//             <Button 
//               variant="text" 
//               sx={{ 
//                 justifyContent: 'flex-start', 
//                 px: 2, 
//                 py: 1, 
//                 borderRadius: 1, 
//                 '&:hover': { bgcolor: 'action.hover' } 
//               }}
//             >
//               Work and Education
//             </Button>
//             <Button 
//               variant="text" 
//               sx={{ 
//                 justifyContent: 'flex-start', 
//                 px: 2, 
//                 py: 1, 
//                 borderRadius: 1, 
//                 '&:hover': { bgcolor: 'action.hover' } 
//               }}
//             >
//               Contact and Basic Info
//             </Button>
//             <Button 
//               variant="text" 
//               sx={{ 
//                 justifyContent: 'flex-start', 
//                 px: 2, 
//                 py: 1, 
//                 borderRadius: 1, 
//                 '&:hover': { bgcolor: 'action.hover' } 
//               }}
//             >
//               Details About {profile.firstName}
//             </Button>
//           </Box>
//         </Box>
        
//         <Box sx={{ width: { xs: '100%', md: '70%' } }}>
//           {/* Bio Section */}
//           <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//               <Typography variant="h6">Bio</Typography>
//               {isOwnProfile && !isEditingBio && (
//                 <Button 
//                   variant="outlined" 
//                   size="small" 
//                   startIcon={<EditIcon />} 
//                   onClick={() => setIsEditingBio(true)}
//                 >
//                   Edit
//                 </Button>
//               )}
//             </Box>
//             {isEditingBio ? (
//               <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveBio(); }}>
//                 <TextField 
//                   fullWidth 
//                   multiline 
//                   rows={4} 
//                   value={bioValue} 
//                   onChange={(e) => setBioValue(e.target.value)} 
//                   placeholder="Tell people about yourself..." 
//                   variant="outlined" 
//                   error={!!bioError} 
//                   helperText={bioError} 
//                   sx={{ mb: 2 }}
//                 />
//                 <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
//                   <Button variant="text" onClick={handleCancelEditBio} disabled={savingBio}>
//                     Cancel
//                   </Button>
//                   <Button 
//                     variant="contained" 
//                     type="submit" 
//                     disabled={savingBio} 
//                     startIcon={savingBio ? <CircularProgress size={16} /> : null}
//                   >
//                     Save
//                   </Button>
//                 </Box>
//               </Box>
//             ) : (
//               profile.bio ? (
//                 <Typography variant="body1">{profile.bio}</Typography>
//               ) : (
//                 <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
//                   {isOwnProfile ? 'Add a bio...' : 'No bio available'}
//                 </Typography>
//               )
//             )}
//           </Paper>

//           {/* Basic Info Section */}
//           <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//               <Typography variant="h6">Basic Information</Typography>
//               {isOwnProfile && !isEditingBasicInfo && (
//                 <Button 
//                   variant="outlined" 
//                   size="small" 
//                   startIcon={<EditIcon />} 
//                   onClick={() => setIsEditingBasicInfo(true)}
//                 >
//                   Edit
//                 </Button>
//               )}
//             </Box>
//             {isEditingBasicInfo ? (
//               <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveBasicInfo(); }}>
//                 <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
//                   <TextField 
//                     label="First Name" 
//                     value={basicInfoValues.firstName} 
//                     onChange={(e) => setBasicInfoValues(prev => ({ ...prev, firstName: e.target.value }))} 
//                     fullWidth 
//                     variant="outlined" 
//                     required
//                   />
//                   <TextField 
//                     label="Last Name" 
//                     value={basicInfoValues.lastName} 
//                     onChange={(e) => setBasicInfoValues(prev => ({ ...prev, lastName: e.target.value }))} 
//                     fullWidth 
//                     variant="outlined" 
//                     required
//                   />
//                 </Box>
//                 <TextField 
//                   label="Location" 
//                   value={basicInfoValues.location} 
//                   onChange={(e) => setBasicInfoValues(prev => ({ ...prev, location: e.target.value }))} 
//                   fullWidth 
//                   variant="outlined" 
//                   placeholder="Where do you live?" 
//                   sx={{ mb: 2 }}
//                 />
//                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                   <Typography variant="subtitle2" sx={{ mr: 1 }}>Username:</Typography>
//                   <Typography variant="body1">@{profile.username}</Typography>
//                   <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
//                     (cannot be changed)
//                   </Typography>
//                 </Box>
//                 {basicInfoError && (
//                   <Alert severity="error" sx={{ mb: 2 }}>{basicInfoError}</Alert>
//                 )}
//                 <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
//                   <Button variant="text" onClick={handleCancelEditBasicInfo} disabled={savingBasicInfo}>
//                     Cancel
//                   </Button>
//                   <Button 
//                     variant="contained" 
//                     type="submit" 
//                     disabled={savingBasicInfo} 
//                     startIcon={savingBasicInfo ? <CircularProgress size={16} /> : null}
//                   >
//                     Save
//                   </Button>
//                 </Box>
//               </Box>
//             ) : (
//               <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, gap: '12px', alignItems: 'start' }}>
//                 <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Name:</Typography>
//                 <Typography variant="body1">{profile.firstName} {profile.lastName}</Typography>
//                 <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Username:</Typography>
//                 <Typography variant="body1">@{profile.username}</Typography>
//                 <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Location:</Typography>
//                 <Typography variant="body1">
//                   {profile.location || (isOwnProfile ? 'Add your location' : 'No location provided')}
//                 </Typography>
//                 {profile.birthday && (
//                   <>
//                     <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Birthday:</Typography>
//                     <Typography variant="body1">{new Date(profile.birthday).toLocaleDateString()}</Typography>
//                   </>
//                 )}
//                 {profile.joinedDate && (
//                   <>
//                     <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Joined:</Typography>
//                     <Typography variant="body1">{new Date(profile.createdAt || profile.joinedDate).toLocaleDateString()}</Typography>
//                   </>
//                 )}
//               </Box>
//             )}
//           </Paper>

//           {/* Work and Education Section */}
//           <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//               <Typography variant="h6">Work and Education</Typography>
//               {isOwnProfile && !isEditingWorkEdu && (
//                 <Button 
//                   variant="outlined" 
//                   size="small" 
//                   startIcon={<EditIcon />} 
//                   onClick={() => setIsEditingWorkEdu(true)}
//                 >
//                   {!profile.work && !profile.education ? 'Add' : 'Edit'}
//                 </Button>
//               )}
//             </Box>
//             {isEditingWorkEdu ? (
//               <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveWorkEdu(); }}>
//                 <TextField 
//                   label="Work" 
//                   value={workEduValues.work} 
//                   onChange={(e) => setWorkEduValues(prev => ({ ...prev, work: e.target.value }))} 
//                   fullWidth 
//                   variant="outlined" 
//                   placeholder="Where do you work?" 
//                   sx={{ mb: 2 }}
//                 />
//                 <TextField 
//                   label="Education" 
//                   value={workEduValues.education} 
//                   onChange={(e) => setWorkEduValues(prev => ({ ...prev, education: e.target.value }))} 
//                   fullWidth 
//                   variant="outlined" 
//                   placeholder="Where did you study?" 
//                   sx={{ mb: 2 }}
//                 />
//                 {workEduError && (
//                   <Alert severity="error" sx={{ mb: 2 }}>{workEduError}</Alert>
//                 )}
//                 <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
//                   <Button variant="text" onClick={handleCancelEditWorkEdu} disabled={savingWorkEdu}>
//                     Cancel
//                   </Button>
//                   <Button 
//                     variant="contained" 
//                     type="submit" 
//                     disabled={savingWorkEdu} 
//                     startIcon={savingWorkEdu ? <CircularProgress size={16} /> : null}
//                   >
//                     Save
//                   </Button>
//                 </Box>
//               </Box>
//             ) : (
//               !profile.education && !profile.work ? (
//                 <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
//                   {isOwnProfile ? 'Add your work and education...' : 'No work or education info'}
//                 </Typography>
//               ) : (
//                 <>
//                   {profile.work && (
//                     <Box sx={{ mb: 2 }}>
//                       <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Work</Typography>
//                       <Typography variant="body1">{profile.work}</Typography>
//                     </Box>
//                   )}
//                   {profile.education && (
//                     <Box>
//                       <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Education</Typography>
//                       <Typography variant="body1">{profile.education}</Typography>
//                     </Box>
//                   )}
//                 </>
//               )
//             )}
//           </Paper>

//           {/* Contact Info Section */}
//           <Paper variant="outlined" sx={{ p: 3 }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//               <Typography variant="h6">Contact Information</Typography>
//               {isOwnProfile && (
//                 <Button variant="outlined" size="small" startIcon={<EditIcon />}>
//                   Edit
//                 </Button>
//               )}
//             </Box>
//             {!profile.email && !profile.website && !profile.phone ? (
//               <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
//                 {isOwnProfile ? 'Add contact info...' : 'No contact info'}
//               </Typography>
//             ) : (
//               <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, gap: '12px', alignItems: 'start' }}>
//                 {profile.email && (
//                   <>
//                     <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Email:</Typography>
//                     <Typography variant="body1">{profile.email}</Typography>
//                   </>
//                 )}
//                 {profile.phone && (
//                   <>
//                     <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Phone:</Typography>
//                     <Typography variant="body1">{profile.phone}</Typography>
//                   </>
//                 )}
//                 {profile.website && (
//                   <>
//                     <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: '120px' }}>Website:</Typography>
//                     <Typography 
//                       variant="body1" 
//                       component="a" 
//                       href={profile.website} 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       sx={{ 
//                         color: 'primary.main', 
//                         textDecoration: 'none', 
//                         '&:hover': { textDecoration: 'underline' } 
//                       }}
//                     >
//                       {profile.website}
//                     </Typography>
//                   </>
//                 )}
//               </Box>
//             )}
//           </Paper>
//         </Box>
//       </Box>
//     </Paper>
//   );
// };

// export default AboutTab;
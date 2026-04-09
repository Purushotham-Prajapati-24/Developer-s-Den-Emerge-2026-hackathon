import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getAuthenticationParameters } from '../services/imagekit.service';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(300).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
  socialLinks: z.object({
    github: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    portfolio: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

// GET /api/profile/:username
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('-password')
      .populate('projects', 'title createdAt language')
      .populate('followers', 'username avatar name')
      .populate('following', 'username avatar name');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// PATCH /api/profile — update authenticated user's own profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const data = updateProfileSchema.parse(req.body);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json(updatedUser);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors });
    return res.status(500).json({ message: 'Error updating profile' });
  }
};

// POST /api/profile/avatar — update avatar URL (called after ImageKit upload)
export const updateAvatarUrl = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { avatarUrl } = req.body;

    if (!avatarUrl) return res.status(400).json({ message: 'Avatar URL required' });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating avatar' });
  }
};

// POST /api/profile/:targetId/follow — toggle follow/unfollow
export const toggleFollow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const targetId = req.params.targetId;

    if (userId === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(userId);

    if (!targetUser || !currentUser) return res.status(404).json({ message: 'User not found' });

    const isFollowing = currentUser.following.some((id: any) => id.toString() === targetUser.id);

    if (isFollowing) {
      await User.findByIdAndUpdate(userId, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: userId } });
      return res.status(200).json({ message: 'Unfollowed successfully', following: false });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: userId } });
      return res.status(200).json({ message: 'Followed successfully', following: true });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error during follow operation' });
  }
};

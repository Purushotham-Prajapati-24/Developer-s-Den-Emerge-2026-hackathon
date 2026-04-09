import { Response } from 'express';
import Notification from '../models/Notification';
import Project from '../models/Project';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /api/notifications
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notifications = await Notification.find({ recipient: userId, status: 'pending' })
      .populate('sender', 'name username avatar')
      .populate('project', 'title language')
      .sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// POST /api/notifications/:id/respond
export const respondToInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const notificationId = req.params.id;
    const userId = req.user!.userId;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ message: 'Notification already processed' });
    }

    notification.status = status;
    await notification.save();

    if (status === 'accepted') {
      // Add collaborator to project
      const project = await Project.findById(notification.project);
      if (project) {
        // Double check if already in
        const exists = project.collaborators.some(c => c.user.toString() === userId);
        if (!exists) {
          project.collaborators.push({
            user: userId as any,
            role: notification.role
          });
          await project.save();
          
          // Add project to user's projects list
          await User.findByIdAndUpdate(userId, { $addToSet: { projects: project._id } });
        }
      }
    }

    return res.status(200).json({ message: `Invitation ${status}`, status });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to respond to invitation' });
  }
};

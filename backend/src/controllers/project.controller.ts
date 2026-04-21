import { Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import Project from '../models/Project';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthRequest } from '../middlewares/auth.middleware';
import { io } from '../services/socket.service';

const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  language: z.string().default('typescript'),
  projectType: z.enum(['programming', 'web-development']).default('programming'),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  language: z.string().optional(),
});

// POST /api/projects
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, language, projectType } = createProjectSchema.parse(req.body);
    const userId = req.user!.userId;

    let initialFiles: any[] = [];
    if (projectType === 'web-development') {
      initialFiles = [{
        id: 'index-html-id', // Simplified internal ID for the seed file
        name: 'index.html',
        language: 'html',
        isMain: true,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Web Project</title>
    <style>
        body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0a0d12; color: white; }
        .container { text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Developer's Den</h1>
        <p>Use the Web Weaver AI on the right to start building.</p>
    </div>
</body>
</html>`
      }];
    }

    const project = await Project.create({
      title,
      language,
      projectType,
      owner: userId,
      collaborators: [{ user: userId, role: 'owner' }],
      files: initialFiles
    });

    // Add project reference to user document
    await User.findByIdAndUpdate(userId, { $addToSet: { projects: project.id } });

    return res.status(201).json({ project });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors });
    return res.status(500).json({ message: 'Failed to create project' });
  }
};

// GET /api/projects — current user's projects
export const getUserProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'collaborators.user': userId }],
    })
      .populate('owner', 'name username avatar')
      .populate('collaborators.user', 'name username avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ projects });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

// GET /api/projects/:id
export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name username avatar')
      .populate('collaborators.user', 'name username avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Fetch pending invitations for this project
    const pendingInvitations = await Notification.find({
      project: req.params.id,
      status: 'pending'
    }).populate('recipient', 'name username avatar');

    return res.status(200).json({ 
      project, 
      pendingInvitations: pendingInvitations.map(inv => ({
        user: inv.recipient,
        role: inv.role,
        sentAt: inv.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch project' });
  }
};

// PATCH /api/projects/:id
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, language } = updateProjectSchema.parse(req.body);
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can update this project' });
    }

    if (title) project.title = title;
    if (language) project.language = language;
    await project.save();

    return res.status(200).json({ project });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors });
    return res.status(500).json({ message: 'Failed to update project' });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can delete this project' });
    }

    // Remove project ref from all collaborators
    const collaboratorIds = project.collaborators.map((c: any) => c.user.toString());
    await User.updateMany(
      { _id: { $in: collaboratorIds } },
      { $pull: { projects: project._id } }
    );

    // Cancel all pending invitations for this project
    await Notification.deleteMany({ project: project._id });

    await Project.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete project' });
  }
};

// POST /api/projects/:id/invite
export const inviteCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const { username, role } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    const validRoles = ['editor', 'commenter', 'reader'];
    const assignedRole = validRoles.includes(role) ? role : 'reader';

    const targetUser = await User.findOne({ username });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check requester is owner
    const isOwner = project.owner.toString() === req.user!.userId;
    if (!isOwner) return res.status(403).json({ message: 'Only the owner can invite collaborators' });

    // Avoid duplicate
    const alreadyIn = project.collaborators.some(
      (c: any) => c.user.toString() === targetUser.id
    );
    if (alreadyIn) return res.status(409).json({ message: 'User already a collaborator' });

    // Check for existing pending invitation
    const existingInvite = await Notification.findOne({
      recipient: targetUser._id,
      project: project._id,
      status: 'pending'
    });
    if (existingInvite) return res.status(409).json({ message: 'Invitation already pending' });

    // Create notification instead of immediate addition
    await Notification.create({
      recipient: targetUser._id,
      sender: req.user!.userId,
      project: project._id,
      role: assignedRole,
      type: 'invitation'
    });

    // Real-time notification to target user
    io.to(`user:${targetUser._id}`).emit('notification-received');
    // Signal project room that team info changed (new pending invite)
    io.to(`project:${project._id}`).emit('collaborator-list-updated');

    return res.status(200).json({ message: 'Invitation sent to user' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to invite collaborator' });
  }
};

// PATCH /api/projects/:id/collaborators/:userId
export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const { id: projectId, userId } = req.params;

    const validRoles = ['editor', 'commenter', 'reader'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership
    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can manage roles' });
    }

    // Update the collaborator's role
    const collaboratorIndex = project.collaborators.findIndex(c => c.user.toString() === userId);
    if (collaboratorIndex === -1) return res.status(404).json({ message: 'Collaborator not found' });

    project.collaborators[collaboratorIndex].role = role as any;
    await project.save();

    // Signal room that team has changed
    io.to(`project:${projectId}`).emit('collaborator-list-updated');

    return res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update role' });
  }
};

// DELETE /api/projects/:id/collaborators/:userId
export const removeCollaborator = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership
    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can remove collaborators' });
    }

    // Safety: cannot remove owner
    if (userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the owner' });
    }

    // Remove from project
    project.collaborators = project.collaborators.filter(c => c.user.toString() !== userId);
    await project.save();

    // Remove from user's projects list
    await User.findByIdAndUpdate(userId, { $pull: { projects: projectId } });

    // Signal room and user
    io.to(`project:${projectId}`).emit('collaborator-list-updated');
    io.to(`user:${userId}`).emit('project-list-updated', { action: 'removed', projectId });

    return res.status(200).json({ message: 'Collaborator removed' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove collaborator' });
  }
};

// DELETE /api/projects/:id/invitations/:recipientId
export const cancelInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, recipientId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check ownership
    if (project.owner.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only the owner can cancel invitations' });
    }

    await Notification.deleteOne({
      project: projectId,
      recipient: recipientId,
      status: 'pending'
    });

    // Signal room and target user
    io.to(`project:${projectId}`).emit('collaborator-list-updated');
    io.to(`user:${recipientId}`).emit('notification-received');

    return res.status(200).json({ message: 'Invitation cancelled' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel invitation' });
  }
};

// POST /api/projects/:id/deploy
export const deployToVercel = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { files } = req.body; // Expecting array of { file: string, data: string }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'No files provided for deployment' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Sanitize project name for Vercel (alphanumeric and hyphens only, max 100)
    const sanitizedName = project.title
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      return res.status(500).json({ message: 'Vercel configuration missing on server' });
    }

    console.log(`[VERCEL] Deploying project "${sanitizedName}" (${projectId})...`);

    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizedName,
        files: files.map((f: any) => ({
          file: f.file,
          data: f.data,
        })),
        projectSettings: {
          framework: null, // Static files
        },
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('[VERCEL] Deployment failed:', data);
      return res.status(response.status).json({ 
        message: 'Vercel deployment failed', 
        error: data.error?.message || 'Unknown error' 
      });
    }

    console.log(`[VERCEL] ✅ Deployment successful: ${data.url}`);

    return res.status(200).json({
      message: 'Project deployed successfully',
      url: data.url,
      inspectUrl: `https://vercel.com/new/project/deployments/${data.id}`,
    });
  } catch (error: any) {
    console.error('[VERCEL] Deployment error:', error);
    return res.status(500).json({ message: 'Failed to trigger deployment', error: error.message });
  }
};

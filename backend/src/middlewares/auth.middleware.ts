import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Project from '../models/Project';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
  projectAccess?: {
    projectId: string;
    role: 'owner' | 'editor' | 'commenter' | 'reader';
  };
}

// Verify standard JWT Access Token
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token expired or invalid' });
  }
};

// RBAC — verify user has required role in a project (real DB check)
export const requireProjectRole = (allowedRoles: ('owner' | 'editor' | 'commenter' | 'reader')[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const projectId = (req.params.projectId || req.params.id) as string;

      if (!userId || !projectId) {
        return res.status(400).json({ message: 'Missing user or project context' });
      }

      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      // Check if user is owner
      if (project.owner.toString() === userId) {
        req.projectAccess = { projectId, role: 'owner' };
        return next();
      }

      // Check collaborators array
      const collaborator = project.collaborators.find(
        (c: any) => c.user.toString() === userId
      );

      if (!collaborator) {
        return res.status(403).json({ message: 'Forbidden: Not a project member' });
      }

      if (!allowedRoles.includes(collaborator.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient project permissions' });
      }

      req.projectAccess = { projectId: projectId as string, role: collaborator.role };
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

import { Router } from 'express';
import { getProfile, toggleFollow, updateAvatarUrl, updateProfile } from '../controllers/profile.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { getAuthenticationParameters } from '../services/imagekit.service';

const router = Router();

// ImageKit secure signature generation (protected)
router.get('/imagekit-auth', verifyToken, (req, res) => {
  try {
    const authParams = getAuthenticationParameters();
    res.json(authParams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate ImageKit signature' });
  }
});

// Profile endpoints
router.get('/:username', getProfile);
router.patch('/', verifyToken, updateProfile);
router.post('/avatar', verifyToken, updateAvatarUrl);
router.post('/:targetId/follow', verifyToken, toggleFollow);

export default router;

import mongoose from 'mongoose';
import User from '../src/models/User';
import Project from '../src/models/Project';
import Notification from '../src/models/Notification';

async function runTest() {
  console.log('🧪 Starting Collaboration Logic Test...');
  
  await mongoose.connect('mongodb://localhost:27017/emerge-hackathon'); // Adjust DB name if needed
  
  try {
    // 1. Setup Test Users
    const userA = await User.findOneAndUpdate(
      { username: 'test_owner' },
      { name: 'Test Owner', email: 'owner@test.com' },
      { upsert: true, new: true }
    );
    
    const userB = await User.findOneAndUpdate(
      { username: 'test_editor' },
      { name: 'Test Editor', email: 'editor@test.com' },
      { upsert: true, new: true }
    );
    
    // 2. Setup Test Project
    const project = await Project.create({
      title: 'Collaboration Test Project',
      owner: userA._id,
      language: 'typescript',
      collaborators: []
    });
    
    console.log(`✅ Test Environment Ready. Project ID: ${project._id}`);
    
    // 3. Simulate Invitation (Logic from project.controller)
    console.log('📤 Sending Invitation...');
    const invite = await Notification.create({
      recipient: userB._id,
      sender: userA._id,
      project: project._id,
      role: 'editor',
      type: 'invitation'
    });
    
    console.log(`✅ Invitation created with status: ${invite.status}`);
    
    // NEW: Verify Pending Invitations Visibility (Simulating GET /api/projects/:id)
    console.log('🔍 Verifying Owner can see pending invitation...');
    const pendingInvites = await Notification.find({
      project: project._id,
      status: 'pending'
    }).populate('recipient', 'name username avatar');
    
    if (pendingInvites.length > 0 && (pendingInvites[0].recipient as any).username === 'test_editor') {
      console.log(`✅ Owner sees pending invitation for @${(pendingInvites[0].recipient as any).username}`);
    } else {
      throw new Error('Owner visibility test failed: Pending invitation not found or incorrect recipient.');
    }
    
    // 4. Verify Invitation Retrieval (Logic from notification.controller)
    const notifications = await Notification.find({ recipient: userB._id, status: 'pending' });
    if (notifications.length === 0) throw new Error('No notifications found for recipient');
    console.log('📥 Recipient received invitation successfully.');
    
    // 5. User B Accepts (Logic from notification.controller)
    console.log('🔄 Accepting Invitation...');
    const targetInvite = notifications[0];
    targetInvite.status = 'accepted';
    await targetInvite.save();
    
    // Logic: Add to project
    await Project.findByIdAndUpdate(project._id, {
      $push: { collaborators: { user: userB._id, role: 'editor' } }
    });
    
    // Logic: Add to user projects
    await User.findByIdAndUpdate(userB._id, {
      $addToSet: { projects: project._id }
    });
    
    // 6. Final Verification
    const updatedProject = await Project.findById(project._id);
    const isCollaborator = updatedProject?.collaborators.some(c => c.user.toString() === userB._id.toString());
    
    if (isCollaborator) {
      console.log('🎉 TEST PASSED: User B is now a collaborator on Project A.');
    } else {
      throw new Error('Verification failed: User B not found in project collaborators.');
    }
    
  } catch (error: any) {
    console.error('❌ TEST FAILED:', error.message);
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await Project.deleteMany({ title: 'Collaboration Test Project' });
    await Notification.deleteMany({ project: { $exists: true } }); // Quick wipe
    // await User.deleteMany({ username: { $in: ['test_owner', 'test_editor'] } });
    await mongoose.disconnect();
  }
}

runTest();

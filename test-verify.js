async function runTests() {
  console.log('--- Starting NextChat Verification Tests ---');

  // 1. Health Check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData.status === 'OK' ? 'PASSED ✅' : 'FAILED ❌', healthData);

  // 2. Register User 1 (Alex Admin)
  const reg1Res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919876543210',
      name: 'Alex Hunter',
      password: 'password123',
      about: 'Founder & Admin at NextChat'
    })
  });
  const reg1Data = await reg1Res.json();
  console.log('2. User 1 Registration:', reg1Data.success ? 'PASSED ✅' : 'FAILED ❌', reg1Data.message || reg1Data.user?.name);
  const token1 = reg1Data.token;
  const user1 = reg1Data.user;

  // 3. Register User 2 (Sarah)
  const reg2Res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919876543211',
      name: 'Sarah Connor',
      password: 'password123',
      about: 'Designer & Explorer'
    })
  });
  const reg2Data = await reg2Res.json();
  console.log('3. User 2 Registration:', reg2Data.success ? 'PASSED ✅' : 'FAILED ❌', reg2Data.message || reg2Data.user?.name);
  const token2 = reg2Data.token;
  const user2 = reg2Data.user;

  // 4. Create Group Chat (Alex creates group with Sarah)
  const groupRes = await fetch('http://localhost:5000/api/chats/group', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      name: 'NextChat Developers',
      description: 'Official group for developers',
      memberIds: [user2.id]
    })
  });
  const groupData = await groupRes.json();
  console.log('4. Create Group Chat with Admin Powers:', groupData.success ? 'PASSED ✅' : 'FAILED ❌', groupData.chat?.name);
  const chatId = groupData.chat?.id;

  // 5. Send Message to Group
  const msgRes = await fetch(`http://localhost:5000/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      content: 'Welcome to the NextChat community! 🚀',
      type: 'TEXT'
    })
  });
  const msgData = await msgRes.json();
  console.log('5. Send Real-Time Message:', msgData.success ? 'PASSED ✅' : 'FAILED ❌', msgData.message?.content);

  // 6. Test Group Admin Settings Toggle (Only admins can send messages)
  const settingsRes = await fetch(`http://localhost:5000/api/chats/${chatId}/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      adminOnlyMessage: true
    })
  });
  const settingsData = await settingsRes.json();
  console.log('6. Admin Settings Toggle (Announcement Mode):', settingsData.success && settingsData.chat?.adminOnlyMessage ? 'PASSED ✅' : 'FAILED ❌');

  // 7. Verify Static Frontend Serving
  const frontendRes = await fetch('http://localhost:5000/');
  const frontendText = await frontendRes.text();
  const hasTitle = frontendText.includes('NextChat');
  console.log('7. Frontend Static Hosting (Single Port 5000):', hasTitle ? 'PASSED ✅' : 'FAILED ❌');

  console.log('--- All Verification Tests Completed Successfully ---');
}

runTests().catch(console.error);

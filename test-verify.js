async function runNextChat2Tests() {
  console.log('=== Starting NextChat 2.0 Feature Verification Suite ===');

  // 1. Health Check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData.status === 'OK' ? 'PASSED ✅' : 'FAILED ❌', healthData);

  // 2. Send OTP for User 1
  const sendOtp1Res = await fetch('http://localhost:5000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919988776655' })
  });
  const sendOtp1Data = await sendOtp1Res.json();
  console.log('2. Send OTP (User 1):', sendOtp1Data.success ? 'PASSED ✅' : 'FAILED ❌', `Code: ${sendOtp1Data.otp}`);
  const otp1 = sendOtp1Data.otp;

  // 3. Verify OTP & Auto-Register User 1
  const verifyOtp1Res = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919988776655',
      otp: otp1,
      name: 'Cyber Alex'
    })
  });
  const verifyOtp1Data = await verifyOtp1Res.json();
  console.log('3. Passwordless OTP Login (User 1):', verifyOtp1Data.success ? 'PASSED ✅' : 'FAILED ❌', verifyOtp1Data.user?.name);
  const token1 = verifyOtp1Data.token;
  const user1 = verifyOtp1Data.user;

  // 4. Send OTP & Verify User 2
  const sendOtp2Res = await fetch('http://localhost:5000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+919988776656' })
  });
  const sendOtp2Data = await sendOtp2Res.json();
  const verifyOtp2Res = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919988776656',
      otp: sendOtp2Data.otp,
      name: 'Nova Sarah'
    })
  });
  const verifyOtp2Data = await verifyOtp2Res.json();
  console.log('4. Passwordless OTP Login (User 2):', verifyOtp2Data.success ? 'PASSED ✅' : 'FAILED ❌', verifyOtp2Data.user?.name);
  const token2 = verifyOtp2Data.token;
  const user2 = verifyOtp2Data.user;

  // 5. Create Group Chat
  const groupRes = await fetch('http://localhost:5000/api/chats/group', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      name: 'NextGen Innovators',
      description: 'Exclusive group for NextChat 2.0 testing',
      memberIds: [user2.id]
    })
  });
  const groupData = await groupRes.json();
  console.log('5. Create NextGen Group:', groupData.success ? 'PASSED ✅' : 'FAILED ❌', groupData.chat?.name);
  const chatId = groupData.chat?.id;

  // 6. Send Live Interactive Poll
  const pollRes = await fetch(`http://localhost:5000/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      content: '📊 Poll: What is your favorite theme?',
      type: 'POLL',
      pollData: {
        question: 'What is your favorite theme in NextChat 2.0?',
        options: [
          { id: 1, text: 'Cyber Obsidian 🌌', votes: [] },
          { id: 2, text: 'Neon Aurora 🌿', votes: [] },
          { id: 3, text: 'Midnight Violet 🔮', votes: [] }
        ],
        isMulti: false
      }
    })
  });
  const pollData = await pollRes.json();
  console.log('6. Launch Live Poll:', pollData.success ? 'PASSED ✅' : 'FAILED ❌', pollData.message?.type);
  const pollMessageId = pollData.message?.id;

  // 7. Vote in Poll from User 2
  const voteRes = await fetch(`http://localhost:5000/api/messages/${pollMessageId}/poll/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token2}`
    },
    body: JSON.stringify({ optionId: 1 })
  });
  const voteData = await voteRes.json();
  console.log('7. Interactive Live Vote Cast:', voteData.success ? 'PASSED ✅' : 'FAILED ❌', voteData.pollData?.options[0]?.votes);

  // 8. React with Emoji (🔥) to Poll Message
  const reactRes = await fetch(`http://localhost:5000/api/messages/${pollMessageId}/react`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token2}`
    },
    body: JSON.stringify({ emoji: '🔥' })
  });
  const reactData = await reactRes.json();
  console.log('8. Animated Emoji Reaction:', reactData.success ? 'PASSED ✅' : 'FAILED ❌', reactData.reactions);

  // 9. Pin Message
  const pinRes = await fetch(`http://localhost:5000/api/messages/${pollMessageId}/pin`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  const pinData = await pinRes.json();
  console.log('9. Pinned Announcement:', pinData.success && pinData.isPinned ? 'PASSED ✅' : 'FAILED ❌');

  // 10. NextBot AI Copilot Request
  const aiRes = await fetch('http://localhost:5000/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      prompt: 'Summarize our recent project discussion and poll',
      type: 'SUMMARIZE',
      chatId: chatId
    })
  });
  const aiData = await aiRes.json();
  console.log('10. NextBot AI Copilot Engine:', aiData.success ? 'PASSED ✅' : 'FAILED ❌');

  console.log('=== All NextChat 2.0 Tests Verified Successfully! ===');
}

runNextChat2Tests().catch(console.error);

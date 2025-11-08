import axios from 'axios';
import { io } from 'socket.io-client';

// --- CONFIGURATION ---
const BASE_URL = 'http://localhost:5000'; // From your server.js
const state = {}; // Stores tokens, IDs, etc., to share between tests

// --- TEST RUNNER ---

/**
 * Main function to run all test phases sequentially.
 */
async function runTestSuite() {
  log('🚀 Starting CodeRoom Test Suite...');
  
  try {
    // Phase 1: Server Health & Authentication API
    await testHealthCheck();
    await testUserRegistration();
    await testUserLogin();

    // Phase 2: Room Management API
    await testRoomApiPermissions();
    await testRoomApiLifecycle();

    // Phase 3: WebSocket Real-time Functionality
    // This is the most complex test, simulating two users.
    await testSocketFeatures();

    // Phase 4: File Management & Code Execution API
    await testFileUploadAndDownload();
    await testCodeExecution();

    log('✅✅✅ Test Suite Finished Successfully! ✅✅✅');
  } catch (error) {
    fail(`🔥🔥🔥 A critical test failed: ${error.message}`);
    log('🔥🔥🔥 Test Suite Halted. 🔥🔥🔥');
  }
}

// --- TEST DEFINITIONS ---

// Phase 1: Health & Auth
async function testHealthCheck() {
  log('--- Phase 1.1: Server Health Check ---');
  const res = await axios.get(`${BASE_URL}/api/health`);
  assert(res.data.status === 'Server is running', 'Test 1: Server is running');
}

async function testUserRegistration() {
  log('--- Phase 1.2: User Registration ---');
  // Test 2: Register Mentor
  state.mentorEmail = `mentor_${Date.now()}@test.com`;
  const resMentor = await axios.post(`${BASE_URL}/api/auth/register`, {
    name: 'Test Mentor', email: state.mentorEmail, password: 'password123', role: 'mentor'
  });
  assert(resMentor.status === 201, 'Test 2: Registered Mentor user');

  // Test 3: Register Student
  state.studentEmail = `student_${Date.now()}@test.com`;
  const resStudent = await axios.post(`${BASE_URL}/api/auth/register`, {
    name: 'Test Student', email: state.studentEmail, password: 'password123', role: 'student'
  });
  assert(resStudent.status === 201, 'Test 3: Registered Student user');

  // Test 4: Register Duplicate (should fail)
  const resDuplicate = await axios.post(`${BASE_URL}/api/auth/register`, {
    name: 'Test Mentor', email: state.mentorEmail, password: 'password123'
  }).catch(e => e.response);
  assert(resDuplicate.status === 400 && resDuplicate.data.error.includes("Email already registered"), 'Test 4: Prevented duplicate email registration');
}

async function testUserLogin() {
  log('--- Phase 1.3: User Login ---');
  // Test 5: Mentor Login
  const resMentor = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: state.mentorEmail, password: 'password123'
  });
  assert(resMentor.data.token, 'Test 5: Mentor login successful');
  state.mentorToken = resMentor.data.token;
  state.mentorId = resMentor.data.user.id;

  // Test 6: Student Login
  const resStudent = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: state.studentEmail, password: 'password123'
  });
  assert(resStudent.data.token, 'Test 6: Student login successful');
  state.studentToken = resStudent.data.token;
  state.studentId = resStudent.data.user.id;

  // Test 7: Bad Login (should fail)
  const resBad = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: state.mentorEmail, password: 'wrongpassword'
  }).catch(e => e.response);
  assert(resBad.status === 401 && resBad.data.error.includes("Invalid credentials"), 'Test 7: Handled invalid credentials');
}

// Phase 2: Room API
async function testRoomApiPermissions() {
  log('--- Phase 2.1: Room API Permissions ---');
  // Test 8: Student tries to create room (should fail)
  const resStudent = await axios.post(`${BASE_URL}/api/rooms/create`, 
    { name: 'Student Room' },
    { headers: { Authorization: `Bearer ${state.studentToken}` } }
  ).catch(e => e.response);
  assert(resStudent.status === 403, 'Test 8: Student correctly blocked from creating room');
}

async function testRoomApiLifecycle() {
  log('--- Phase 2.2: Room API Lifecycle ---');
  // Test 9: Mentor creates room
  const resMentor = await axios.post(`${BASE_URL}/api/rooms/create`, 
    { name: 'Mentor Test Room', language: 'javascript' },
    { headers: { Authorization: `Bearer ${state.mentorToken}` } }
  );
  assert(resMentor.status === 201 && resMentor.data.room, 'Test 9: Mentor successfully created room');
  state.roomId = resMentor.data.room.roomId; // The short UUID
  state.roomMongoId = resMentor.data.room._id; // The Mongo _id

  // Test 10: Get active rooms
  const resActive = await axios.get(`${BASE_URL}/api/rooms/active`);
  const found = resActive.data.find(r => r.roomId === state.roomId);
  assert(found, 'Test 10: Get active rooms: Found created room');

  // Test 11: Get room by ID
  const resSpecific = await axios.get(`${BASE_URL}/api/rooms/${state.roomId}`);
  assert(resSpecific.data.roomId === state.roomId, 'Test 11: Get specific room: Found room by ID');

  // Test 12: Student joins room (via API)
  const resJoin = await axios.post(`${BASE_URL}/api/rooms/${state.roomId}/join`, 
    {},
    { headers: { Authorization: `Bearer ${state.studentToken}` } }
  );
  assert(resJoin.data.message === 'Joined room', 'Test 12: Student joined room via API');
}

// Phase 3: Sockets
async function testSocketFeatures() {
  log('--- Phase 3: Socket.IO Real-time Features ---');

  return new Promise((resolve, reject) => {
    let mentorSocket, studentSocket;
    const tests = {
      mentorJoined: false,
      studentJoined: false,
      chatReceivedByMentor: false,
      chatReceivedByStudent: false,
      studentEditBlocked: false,
      modeChangeReceived: false,
      studentEditAllowed: false,
      feedbackReceived: false,
      studentLeft: false,
    };

    const checkDone = () => {
      const allPassed = Object.values(tests).every(Boolean);
      if (allPassed) {
        log('--- All Socket.IO tests passed ---');
        mentorSocket.disconnect();
        studentSocket.disconnect();
        resolve();
      }
    };
    
    // Create mentor client
    mentorSocket = io(BASE_URL, { forceNew: true });
    
    // Create student client
    studentSocket = io(BASE_URL, { forceNew: true });

    // --- Mentor Socket Handlers ---
    mentorSocket.on('connect', () => {
      mentorSocket.emit('join-room', state.roomId, state.mentorId); //
    });
    
    mentorSocket.on('room-data', (data) => {
      assert(!tests.mentorJoined, 'Test 13: Mentor received room-data', tests, 'mentorJoined');
      checkDone();
    });

    mentorSocket.on('user-joined', (data) => { //
      if (data.user.id === state.studentId) {
        assert(!tests.studentJoined, 'Test 14: Mentor received user-joined event for student', tests, 'studentJoined');
        checkDone();
        
        // Trigger chat test
        setTimeout(() => studentSocket.emit('send-message', state.roomId, state.studentId, 'Hello from student'), 200); //
      }
    });

    mentorSocket.on('new-message', (msg) => { //
      if (msg.text === 'Hello from student') {
        assert(!tests.chatReceivedByMentor, 'Test 15: Mentor received student chat message', tests, 'chatReceivedByMentor');
        checkDone();
        
        // Mentor replies
        mentorSocket.emit('send-message', state.roomId, state.mentorId, 'Hello from mentor');
      }
    });

    mentorSocket.on('code-update', (data) => { //
      if (data.code === 'student code change ALLOWED') {
        assert(!tests.studentEditAllowed, "Test 19: Mentor received 'code-update' from student in 'interview' mode", tests, 'studentEditAllowed');
        checkDone();
        
        // Mentor sends feedback
        mentorSocket.emit('add-feedback', state.roomId, state.mentorId, 5, 'Great line'); //
      }
    });

    mentorSocket.on('user-left', (data) => { //
      if (data.userId === state.studentId) {
        assert(!tests.studentLeft, 'Test 21: Mentor received user-left event', tests, 'studentLeft');
        checkDone();
      }
    });

    // --- Student Socket Handlers ---
    studentSocket.on('connect', () => {
      studentSocket.emit('join-room', state.roomId, state.studentId);
    });
    
    studentSocket.on('new-message', (msg) => {
      if (msg.text === 'Hello from mentor') {
        assert(!tests.chatReceivedByStudent, 'Test 16: Student received mentor chat message', tests, 'chatReceivedByStudent');
        checkDone();
        
        // Trigger student edit fail test
        studentSocket.emit('code-change', state.roomId, state.studentId, 'student code change BLOCKED'); //
      }
    });

    studentSocket.on('error', (err) => {
      if (err.message.includes("don't have permission")) { //
        assert(!tests.studentEditBlocked, "Test 17: Student correctly blocked from editing in 'teaching' mode", tests, 'studentEditBlocked');
        checkDone();
        
        // Mentor toggles mode
        mentorSocket.emit('toggle-mode', state.roomId, state.mentorId, 'interview'); //
      }
    });

    studentSocket.on('mode-changed', (data) => { //
      if (data.mode === 'interview') {
        assert(!tests.modeChangeReceived, "Test 18: Student received 'mode-changed' to interview event", tests, 'modeChangeReceived');
        checkDone();
        
        // Trigger student edit success test
        studentSocket.emit('code-change', state.roomId, state.studentId, 'student code change ALLOWED');
      }
    });
    
    studentSocket.on('feedback-added', (data) => { //
      if (data.feedback === 'Great line') {
        assert(!tests.feedbackReceived, "Test 20: Student received mentor feedback", tests, 'feedbackReceived');
        checkDone();
        
        // Trigger student leave
        studentSocket.emit('leave-room', state.roomId, state.studentId); //
      }
    });
    
    // Timeout to prevent tests from hanging
    setTimeout(() => {
      if (!Object.values(tests).every(Boolean)) {
        console.log('Socket Test Status:', tests);
        reject(new Error('Socket test timeout'));
      }
    }, 5000); // 5-second timeout
  });
}

// Phase 4: Files & Execution
async function testFileUploadAndDownload() {
  log('--- Phase 4.1: File Upload & Management ---');
  let fileId;
  
  // Test 22: Upload File
  const fileData = Buffer.from('this is a test file contents').toString('base64');
  const resUpload = await axios.post(`${BASE_URL}/api/files/upload`, 
    {
      filename: 'test.txt',
      fileData: fileData,
      room: state.roomMongoId // Ref to Room._id
    },
    { headers: { Authorization: `Bearer ${state.studentToken}` } }
  );
  assert(resUpload.status === 201 && resUpload.data.file, 'Test 22: File uploaded successfully');
  fileId = resUpload.data.file._id;

  // Test 23: Get files for room
  const resGet = await axios.get(`${BASE_URL}/api/files/room/${state.roomMongoId}`); //
  const foundFile = resGet.data.find(f => f._id === fileId);
  assert(foundFile, 'Test 23: Get files for room: Found uploaded file');

  // Test 24: Download file
  const resDownload = await axios.get(`${BASE_URL}/api/files/download/${fileId}`); //
  assert(resDownload.data === 'this is a test file contents', 'Test 24: File download: Content matches');

  // Test 25: Delete file
  const resDelete = await axios.delete(`${BASE_URL}/api/files/${fileId}`, 
    { headers: { Authorization: `Bearer ${state.studentToken}` } } //
  );
  assert(resDelete.data.message === 'File deleted', 'Test 25: File deleted successfully');
}

async function testCodeExecution() {
  log('--- Phase 4.2: Code Execution ---');
  // Test 26: Execute JS code
  const res = await axios.post(`${BASE_URL}/api/execute/execute`,
    {
      language: 'javascript',
      code: 'console.log("hello world");'
    },
    { headers: { Authorization: `Bearer ${state.studentToken}` } } //
  );
  assert(res.data.stdout.trim() === 'hello world', 'Test 26: Code execution (JS): Correct output');
}


// --- HELPERS ---

let testCounter = 1;

/**
 * Logs a message to the console.
 */
function log(message) {
  console.log(`\n[INFO] ${message}`);
}

/**
 * Logs a pass message.
 */
function pass(message) {
  console.log(` ✅ [PASS] ${message}`);
}

/**
 * Logs a fail message and throws an error to stop the suite.
 */
function fail(message) {
  console.error(` ❌ [FAIL] ${message}`);
  throw new Error(message);
}

/**
 * Asserts a condition. If false, logs fail and throws.
 * @param {boolean} condition - The condition to check.
 * @param {string} message - The success/fail message.
 * @param {object} [testObj] - (For socket tests) The test tracking object.
 * @param {string} [testKey] - (For socket tests) The key to set to true.
 */
function assert(condition, message, testObj = null, testKey = null) {
  if (condition) {
    if (testObj && testKey) {
      if (testObj[testKey]) return; // Already passed, don't log again
      testObj[testKey] = true;
    }
    pass(message);
  } else {
    fail(message);
  }
}

// --- RUN THE SUITE ---
runTestSuite();
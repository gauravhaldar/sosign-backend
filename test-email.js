import { sendEmail, createPetitionEmailTemplate } from './config/emailConfig.js';
import dotenv from 'dotenv';

dotenv.config();

// Test email functionality
const testEmail = async () => {
  console.log('Testing email functionality...');
  
  // Check if email configuration is set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration missing!');
    console.log('Please set the following environment variables:');
    console.log('- EMAIL_USER');
    console.log('- EMAIL_PASSWORD');
    console.log('- EMAIL_SERVICE (optional, defaults to gmail)');
    console.log('- FRONTEND_URL (optional, defaults to http://localhost:3000)');
    return;
  }

  // Create a mock petition for testing
  const mockPetition = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Petition - Improve Local Infrastructure',
    country: 'India',
    petitionStarter: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    decisionMakers: [
      {
        name: 'Mayor Smith',
        email: process.env.TEST_EMAIL || process.env.EMAIL_USER, // Send to yourself for testing
        position: 'Mayor'
      }
    ],
    createdAt: new Date(),
    petitionDetails: {
      problem: 'The local roads are in poor condition and need immediate repair.',
      solution: 'We request the city council to allocate budget for road repairs and maintenance.'
    }
  };

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const petitionUrl = `${frontendUrl}/currentpetitions/${mockPetition._id}`;

  try {
    // Test 1: Create email template
    console.log('📧 Creating email template...');
    const emailTemplate = createPetitionEmailTemplate(mockPetition, petitionUrl);
    console.log('✅ Email template created successfully');

    // Test 2: Send test email
    console.log('📤 Sending test email...');
    const testEmailAddress = process.env.TEST_EMAIL || process.env.EMAIL_USER;
    
    const result = await sendEmail(
      testEmailAddress,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Sent to: ${testEmailAddress}`);
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }

  } catch (error) {
    console.error('❌ Error during email test:', error.message);
  }
};

// Run the test
testEmail().then(() => {
  console.log('\n🏁 Email test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

import dotenv from 'dotenv';
import { sendPetitionNotificationEmails } from './config/emailConfig.js';

dotenv.config();

// Test function to simulate petition creation and email sending
const testPetitionEmail = async () => {
  console.log('🧪 Testing petition email functionality...');
  
  // Create a mock petition object similar to what would be created
  const mockPetition = {
    _id: '507f1f77bcf86cd799439011', // Mock ObjectId
    title: 'Test Petition for Email Functionality',
    country: 'India',
    createdAt: new Date(),
    petitionStarter: {
      name: 'Test User',
      email: 'test@example.com'
    },
    decisionMakers: [
      {
        name: 'Test Decision Maker 1',
        email: 'haldarainit@gmail.com', // Use your test email
        position: 'Test Position'
      },
      {
        name: 'Test Decision Maker 2',
        email: 'test2@example.com', // This will fail (no real email)
        position: 'Test Position 2'
      }
    ]
  };

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  console.log('📧 Sending test petition emails...');
  console.log('Petition details:', {
    title: mockPetition.title,
    decisionMakers: mockPetition.decisionMakers.length,
    frontendUrl
  });

  try {
    const result = await sendPetitionNotificationEmails(mockPetition, frontendUrl);
    
    if (result.success) {
      console.log('✅ Petition emails sent successfully!');
      console.log(`📊 Results: ${result.totalSent} sent, ${result.totalFailed} failed`);
      console.log('📋 Detailed results:', result.results);
    } else {
      console.error('❌ Failed to send petition emails:', result.error);
    }
  } catch (error) {
    console.error('❌ Error in petition email test:', error);
  }
};

// Run the test
testPetitionEmail()
  .then(() => {
    console.log('🏁 Petition email test completed');
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
  });

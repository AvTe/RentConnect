import { NextResponse } from 'next/server';
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

export async function POST(request) {
  try {
    const { token, action } = await request.json();

    if (!token || !action) {
      return NextResponse.json({ error: 'Token and action are required' }, { status: 400 });
    }

    // TODO: Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set
    // or that the environment has default credentials configured.
    
    const projectID = "we-drive-468503";
    const recaptchaKey = "6LfThBosAAAAALZ06Y7e9jaFROeO_hSgiGdzQok1";

    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    const requestData = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(requestData);

    if (!response.tokenProperties.valid) {
      console.error(`Invalid token: ${response.tokenProperties.invalidReason}`);
      return NextResponse.json({ 
        success: false, 
        error: `Invalid token: ${response.tokenProperties.invalidReason}` 
      }, { status: 400 });
    }

    if (response.tokenProperties.action === action) {
      const score = response.riskAnalysis.score;
      console.log(`reCAPTCHA score: ${score}`);
      
      // Threshold for considering it a human (0.0 to 1.0)
      // 1.0 is very likely human, 0.0 is very likely bot
      const isHuman = score >= 0.5;
      
      return NextResponse.json({ 
        success: true, 
        score: score, 
        reasons: response.riskAnalysis.reasons,
        isHuman: isHuman
      });
    } else {
      console.error("Action mismatch");
      return NextResponse.json({ 
        success: false, 
        error: 'Action mismatch' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json({ error: 'Internal server error during verification' }, { status: 500 });
  }
}

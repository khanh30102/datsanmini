async function requestPhoneVerification(to) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    const error = new Error('Dịch vụ SMS chưa được cấu hình.');
    error.status = 503;
    throw error;
  }

  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const endpoint = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const body = new URLSearchParams({ To: to, Channel: 'sms' });
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body,
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    const error = new Error('Không thể kết nối dịch vụ SMS.');
    error.status = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Twilio Verify từ chối yêu cầu gửi OTP (HTTP ${response.status}).`);
    error.status = 502;
    throw error;
  }
}

async function checkPhoneVerification(to, code) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    const error = new Error('Dịch vụ SMS chưa được cấu hình.');
    error.status = 503;
    throw error;
  }

  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const endpoint = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ To: to, Code: code }),
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    const error = new Error('Không thể kết nối dịch vụ xác minh SMS.');
    error.status = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Twilio Verify từ chối yêu cầu xác minh (HTTP ${response.status}).`);
    error.status = 502;
    throw error;
  }

  const result = await response.json();
  return result.status === 'approved';
}

module.exports = { checkPhoneVerification, requestPhoneVerification };

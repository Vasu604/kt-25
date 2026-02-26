const otpStore = new Map();

exports.saveOtp = (phone, otp) => {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 min expiry
  });
};

exports.verifyOtp = (phone, otp) => {
  const data = otpStore.get(phone);

  if (!data) return false;

  if (Date.now() > data.expiresAt) {
    otpStore.delete(phone);
    return false;
  }

  if (data.otp !== otp) return false;

  otpStore.delete(phone);
  return true;
};

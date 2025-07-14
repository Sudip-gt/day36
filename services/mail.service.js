exports.sendLoginAlertEmail = async (email, device) => {
  console.log(`Login alert sent to ${email}`);
  console.log(`Device: ${device.browser} on ${device.os}, IP: ${device.ip}`);
};

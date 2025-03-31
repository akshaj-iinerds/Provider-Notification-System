const { checkLicenseExpiry } = require("../services/licenseService");

const checkLicenseExpiryController = async (req, res) => {
  try {
    const result = await checkLicenseExpiry();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { checkLicenseExpiryController };

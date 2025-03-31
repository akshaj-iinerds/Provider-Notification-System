const express = require("express");
const { checkLicenseExpiryController } = require("../controllers/licenseController");

const router = express.Router();

router.get("/check-license-expiry", checkLicenseExpiryController);

module.exports = router;

const express = require("express");
const controller = require("../controllers/providerController");

const router = express.Router();

// Add a provider
router.post("/addprovider", controller.addProvider);

// Verify a provider by NPI
router.post("/verify/:npiNumber", controller.verifyProvider);

// Get a provider by license number (Database)
router.get("/license/:licenseNumber", controller.getProviderByLicense);

// Get providers by taxonomy from the database
router.get("/taxonomy/:taxonomy", controller.getProvidersByTaxonomy);

// Get providers by organization name and state from NPPES API (expects query params organizationName & state)
router.get("/organization", controller.getProvidersByOrganizationAndState);

// Get providers by taxonomy and state from NPPES API
router.get("/taxonomy/:taxonomy/state/:state", controller.getProvidersByTaxonomyAndState);

// Get a provider by NPI (Database)
router.get("/npi/:npiNumber", controller.getProviderByNPI);

// Get all verified providers (Database)
router.get("/verified", controller.getAllVerifiedProviders);

// Check provider license in a given state (NPPES API + Database)
router.get("/license-check/:npiNumber/:state", controller.checkProviderLicenseInState);

module.exports = router;

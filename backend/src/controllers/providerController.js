const providerService = require("../services/providerService");
const logger = require("../utils/logger");

// Add Provider
exports.addProvider = async (req, res) => {
  try {
    const provider = await providerService.addProvider(req.body);
    return res.status(201).json({ message: "Provider added successfully", provider });
  } catch (error) {
    logger.error(`Failed to add provider: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
};

// Verify Provider
exports.verifyProvider = async (req, res) => {
  try {
    const { npiNumber } = req.params;
    const verificationResult = await providerService.verifyProvider(npiNumber);
    return res.json({ npiNumber, ...verificationResult });
  } catch (error) {
    logger.error(`Verification failed: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
};

// Get Provider by License
exports.getProviderByLicense = async (req, res) => {
  try {
    const { licenseNumber } = req.params;
    const provider = await providerService.getProviderByLicense(licenseNumber);
    return res.json({ provider });
  } catch (error) {
    logger.error(`Error fetching provider by license: ${error.message}`);
    return res.status(404).json({ error: error.message });
  }
};

// Get Providers by Taxonomy (from Database)
exports.getProvidersByTaxonomy = async (req, res) => {
  try {
    const { taxonomy } = req.params;
    const providers = await providerService.getProvidersByTaxonomy(taxonomy);
    return res.json({ providers });
  } catch (error) {
    logger.error(`Error fetching providers by taxonomy: ${error.message}`);
    return res.status(404).json({ error: error.message });
  }
};

// Get Providers by Organization and State (via NPPES API)
exports.getProvidersByOrganizationAndState = async (req, res) => {
  try {
    const { organizationName, state } = req.query;
    const providers = await providerService.getProvidersByOrganizationAndState(organizationName, state);
    return res.json({ providers });
  } catch (error) {
    logger.error(`Error fetching providers by organization: ${error.message}`);
    return res.status(404).json({ error: error.message });
  }
};

// Get Providers by Taxonomy and State (via NPPES API)
exports.getProvidersByTaxonomyAndState = async (req, res) => {
  try {
    const { taxonomy, state } = req.params;
    const providers = await providerService.getProvidersByTaxonomyAndState(taxonomy, state);
    return res.json({ providers });
  } catch (error) {
    logger.error(`Error fetching providers by taxonomy and state: ${error.message}`);
    return res.status(404).json({ error: error.message });
  }
};

// Get Provider by NPI (from Database)
exports.getProviderByNPI = async (req, res) => {
  try {
    const { npiNumber } = req.params;
    const provider = await providerService.getProviderByNPI(npiNumber);
    return res.json({ provider });
  } catch (error) {
    logger.error(`Error fetching provider by NPI: ${error.message}`);
    return res.status(404).json({ error: error.message });
  }
};

// Get All Verified Providers (from Database)
exports.getAllVerifiedProviders = async (req, res) => {
  try {
    const providers = await providerService.getAllVerifiedProviders();
    return res.json({ providers });
  } catch (error) {
    logger.error(`Error fetching verified providers: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

// Check Provider License in a given State (NPPES API + Database)
exports.checkProviderLicenseInState = async (req, res) => {
  try {
    const { npiNumber, state } = req.params;
    const result = await providerService.checkProviderLicenseInState(npiNumber, state);
    return res.json(result);
  } catch (error) {
    logger.error(`Error checking provider license in state: ${error.message}`);
    return res.status(404).json({ error: error.message });
  }
};

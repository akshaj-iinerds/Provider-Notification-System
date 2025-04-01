const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const logger = require("../utils/logger");
require('dotenv').config(); // Load environment variables

const NPPES_API_URL = process.env.NPPES_API_URL;

// Retry failed requests (handles API rate limits)
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => error.response?.status === 429,
});

// Fetch provider data from NPPES API
exports.fetchProviderData = async (npiNumber) => {
  try {
    logger.info(`Fetching NPPES data for NPI: ${npiNumber}`);
    const response = await axios.get(`${NPPES_API_URL}/?number=${npiNumber}&version=2.1`);
    
    if (!response.data.results || response.data.results.length === 0) {
      logger.error(`No data found for NPI: ${npiNumber}`);
      return null;
    }
    return response.data.results[0];
  } catch (error) {
    logger.error(`Error fetching NPPES data: ${error.message}`);
    return null;
  }
};

// Fetch providers by organization name and state
exports.fetchProvidersByOrganizationAndState = async (organizationName, state) => {
  try {
    const url = `${NPPES_API_URL}/?organization_name=${encodeURIComponent(organizationName)}&state=${state}&version=2.1`;
    const response = await axios.get(url);

    if (!response.data.results || response.data.results.length === 0) {
      logger.error(`No providers found for ${organizationName} in ${state}`);
      return null;
    }
    return response.data.results.map(provider => ({
      npiNumber: provider.number,
      name: provider.basic?.organization_name || `${provider.basic?.first_name} ${provider.basic?.last_name}`.trim() || "Unknown",
      state: provider.addresses?.[0]?.state || "Unknown",
      address: provider.addresses?.[0] || {},
    }));
  } catch (error) {
    logger.error(`Error fetching providers by organization: ${error.message}`);
    return null;
  }
};

// Fetch providers by taxonomy and state
exports.fetchProvidersByTaxonomyAndState = async (taxonomy, state) => {
  try {
    const url = `${NPPES_API_URL}/?taxonomy_description=${encodeURIComponent(taxonomy)}&state=${state}&version=2.1`;
    const response = await axios.get(url);

    if (!response.data.results || response.data.results.length === 0) {
      return { message: `No providers found for ${taxonomy} in ${state}` };
    }
    return response.data.results.map(provider => ({
      npiNumber: provider.number,
      name: provider.basic?.organization_name || provider.basic?.name || "Unknown",
      state: provider.addresses?.[0]?.state || "Unknown",
      address: provider.addresses?.[0] || {},
    }));
  } catch (error) {
    logger.error(`Error fetching providers by taxonomy: ${error.message}`);
    return { error: "Failed to fetch providers" };
  }
};

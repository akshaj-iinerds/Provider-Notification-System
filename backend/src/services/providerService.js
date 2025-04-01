const { Provider } = require("../models");
const {
  fetchProviderData,
  fetchProvidersByOrganizationAndState,
  fetchProvidersByTaxonomyAndState,
} = require("./nppesService");

const addProvider = async (providerData) => {
    const { firstName, lastName,name, email, specialization,taxonomy, npiNumber, state, licenseNumber, licenseExpiryDate } = providerData;
  
    if (!firstName || !lastName ||!name || !email || !specialization ||!taxonomy || !npiNumber || !state || !licenseNumber || !licenseExpiryDate) {
      throw new Error("All fields are required");
    }
  
    const existingProvider = await Provider.findOne({ where: { npiNumber } });
    if (existingProvider) {
      throw new Error("Provider with this NPI already exists");
    }
  
    return await Provider.create({
      firstName,
      lastName,
      name,
      email,
      specialization,
      taxonomy,
      npiNumber,
      state,
      licenseNumber,
      licenseExpiryDate,
      verified: false,
    });
  };
  

const verifyProvider = async (npiNumber) => {
  const provider = await Provider.findOne({ where: { npiNumber } });
  if (!provider) throw new Error("Provider not found in database");

  const nppesProvider = await fetchProviderData(npiNumber);
  if (!nppesProvider) throw new Error("NPI not found in NPPES registry");

  const nppesFirstName = nppesProvider.basic?.first_name || "";
  const nppesLastName = nppesProvider.basic?.last_name || "";
  const nppesState = nppesProvider.addresses?.[0]?.state || "Unknown";

  const isMatch =
    provider.firstName.toLowerCase() === nppesFirstName.toLowerCase() &&
    provider.lastName.toLowerCase() === nppesLastName.toLowerCase() &&
    provider.state.toUpperCase() === nppesState.toUpperCase();

  await provider.update({ verified: isMatch });

  return {
    npiNumber,
    providerFirstName: provider.firstName,
    providerLastName: provider.lastName,
    providerState: provider.state,
    nppesFirstName,
    nppesLastName,
    nppesState,
    status: isMatch ? "Verified" : "Mismatch",
  };
};

const getProviderByLicense = async (licenseNumber) => {
  return await Provider.findOne({ where: { licenseNumber } });
};

const getProvidersByTaxonomy = async (taxonomy) => {
  return await Provider.findAll({ where: { taxonomy } });
};

const getProvidersByOrganizationAndState = async (organizationName, state) => {
  return await fetchProvidersByOrganizationAndState(organizationName, state);
};

const getProvidersByTaxonomyAndState = async (taxonomy, state) => {
  return await fetchProvidersByTaxonomyAndState(taxonomy, state);
};

const getProviderByNPI = async (npiNumber) => {
  return await Provider.findOne({ where: { npiNumber } });
};

const getAllVerifiedProviders = async () => {
  return await Provider.findAll({ where: { verified: true } });
};

const checkProviderLicenseInState = async (npiNumber, state) => {
  const provider = await Provider.findOne({ where: { npiNumber } });
  if (!provider) throw new Error("Provider not found in database");

  const nppesData = await fetchProviderData(npiNumber);
  if (!nppesData || !nppesData.addresses || nppesData.addresses.length === 0) {
    throw new Error("Provider not found in NPPES registry");
  }

  const hasLicenseInState = nppesData.addresses.some(addr => addr.state === state.toUpperCase());
  return {
    npiNumber,
    providerName: `${provider.firstName} ${provider.lastName}`,
    providerState: provider.state,
    nppesStateMatch: hasLicenseInState ? "License found in state" : "No license found in state",
    verified: provider.verified,
  };
};

module.exports = {
  addProvider,
  verifyProvider,
  getProviderByLicense,
  getProvidersByTaxonomy,
  getProvidersByOrganizationAndState,
  getProvidersByTaxonomyAndState,
  getProviderByNPI,
  getAllVerifiedProviders,
  checkProviderLicenseInState,
};
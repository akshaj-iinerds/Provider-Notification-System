'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename old column to match new structure
    await queryInterface.renameColumn('Providers', 'license_number', 'licenseNumber');
    await queryInterface.renameColumn('Providers', 'license_expiry_date', 'licenseExpiryDate');

    // Add new columns
    await queryInterface.addColumn('Providers', 'firstName', {
      type: Sequelize.STRING,
      allowNull: true, // Temporarily allow NULL to avoid errors
    });

    await queryInterface.addColumn('Providers', 'lastName', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Providers', 'npiNumber', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn('Providers', 'verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Set default values for existing rows
    await queryInterface.sequelize.query(`
      UPDATE "Providers"
      SET "firstName" = 'Unknown', "lastName" = 'Unknown'
      WHERE "firstName" IS NULL OR "lastName" IS NULL;
    `);

    // Change firstName and lastName to NOT NULL
    await queryInterface.changeColumn('Providers', 'firstName', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Providers', 'lastName', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Providers', 'firstName');
    await queryInterface.removeColumn('Providers', 'lastName');
    await queryInterface.removeColumn('Providers', 'npiNumber');
    await queryInterface.removeColumn('Providers', 'verified');

    // Rename columns back to original names
    await queryInterface.renameColumn('Providers', 'licenseNumber', 'license_number');
    await queryInterface.renameColumn('Providers', 'licenseExpiryDate', 'license_expiry_date');
  },
};



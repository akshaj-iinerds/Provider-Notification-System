'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the 'role' column
    await queryInterface.removeColumn('Providers', 'role');

    // Add the 'taxonomy' column
    await queryInterface.addColumn('Providers', 'taxonomy', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the 'role' column if migration is rolled back
    await queryInterface.addColumn('Providers', 'role', {
      type: Sequelize.ENUM('provider'),
      allowNull: false,
      defaultValue: 'provider',
    });

    // Remove the 'taxonomy' column if migration is rolled back
    await queryInterface.removeColumn('Providers', 'taxonomy');
  }
};


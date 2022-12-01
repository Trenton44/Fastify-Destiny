let mockAxios = jest.createMockFromModule("axios");
mockAxios.create = jest.fn(() => mockAxios);
mockAxios.request = jest.fn(() => Promise.reject("You shouldn't be making requests here."));
module.exports = mockAxios;
let mockAxios = jest.createMockFromModule("axios");
Object.entries(mockAxios).forEach( ([key, value]) => {
    value = jest.fn(() => Promise.reject("You shouldn't be making an axios request here."));
});
mockAxios.create = jest.fn(() => mockAxios);
module.exports = mockAxios;
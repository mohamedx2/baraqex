export const get = (req, res) => {
  res.json({
    message: 'Hello from the API!',
    time: new Date().toISOString(),
    features: [
      'Server-side rendering',
      'API integration',
      'No build step required'
    ]
  });
};

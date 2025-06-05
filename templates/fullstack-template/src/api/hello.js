export function get(req, res) {
  res.json({ 
    message: 'Hello from API!',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
}

export function post(req, res) {
  const { name } = req.body;
  res.json({ 
    message: `Hello ${name || 'World'}!`,
    timestamp: new Date().toISOString(),
    method: 'POST',
    received: req.body
  });
}

export function get(req, res) {
  res.json({
    message: 'Hello from Baraqex API!',
    timestamp: new Date().toISOString(),
    method: 'GET',
    path: req.path
  });
}

export function post(req, res) {
  res.json({
    message: 'Hello from Baraqex API!',
    timestamp: new Date().toISOString(),
    method: 'POST',
    body: req.body,
    path: req.path
  });
}

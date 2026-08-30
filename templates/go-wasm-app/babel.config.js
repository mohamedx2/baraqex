const config = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      },
      // Enable dynamic imports for both ESM and CommonJS
      modules: false
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'createElement',
      pragmaFrag: 'Fragment'
    }]
  ]
};

// Support both ESM and CommonJS
export default config;
module.exports = config;

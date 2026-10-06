try {
  const effects = require('./effects.js');
  console.log('Module loaded successfully');
  if (typeof effects.playSuccess === 'function') {
    console.log('playSuccess exists');
  }
  if (typeof effects.playFailure === 'function') {
    console.log('playFailure exists');
  }
} catch (err) {
  console.error('Error loading effects module:', err.message);
  process.exit(1);
}
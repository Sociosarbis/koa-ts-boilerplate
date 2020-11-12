const dotEnv = require('dotenv');
const path = require('path');

const env = process.env.NODE_ENV || 'production';

dotEnv.config({ path: path.join(__dirname, `../${env}.env`) });

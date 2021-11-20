const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../.env') });

const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number().default(3000),
    GOOGLE_CLIENT_ID: Joi.string().required().description('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: Joi.string()
      .required()
      .description('GOOGLE_CLIENT_SECRET'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  port : envVars.PORT,
  google_client_id : envVars.GOOGLE_CLIENT_ID,
  google_client_secret : envVars.GOOGLE_CLIENT_SECRET,
};

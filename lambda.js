const serverlessExpress = require('@codegenie/serverless-express');
const app = require('./src/app');
const connectDB = require('./src/config/db');

let serverlessExpressInstance;

async function setup(event, context) {
  // Establish database connection
  await connectDB();
  
  // Wrap Express app with serverless-express
  serverlessExpressInstance = serverlessExpress({ app });
  
  return serverlessExpressInstance(event, context);
}

exports.handler = (event, context) => {
  // If the instance is already warm, process the request directly
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  
  // Otherwise perform initialization
  return setup(event, context);
};

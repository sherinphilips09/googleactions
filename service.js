const OracleBot = require('@oracle/bots-node-sdk');
const { WebhookClient, WebhookEvent } = OracleBot.Middleware;
//Self Hosted Express Server
const bodyParser = require('body-parser')
const { dialogflow } = require('actions-on-google');
const assistant = dialogflow();

// start service object
module.exports = (app) => {
  const logger = console;
  // initialize the application with OracleBot
  OracleBot.init(app, {
    logger,
  });

  // add webhook integration to Oracle Cloud
  const webhook = new WebhookClient({
    channel: {
      url: 'https://botv2frk1I0208H4446A1bots-mpaasocimt.botmxp.ocp.oraclecloud.com:443/connectors/v1/tenants/idcs-6d466372210e4300bb31f4db15e8e96c/listeners/webhook/channels/444a6b97-536c-421a-a7f0-428422cbe660',
      secret: 'SiFQ1H76IvskOPFZ1kagcl5JphnkHZBZ'
    }
  });
  // Add webhook event handlers (optional)
  webhook
    .on(WebhookEvent.ERROR, err => logger.error('Error:', err.message))
    .on(WebhookEvent.MESSAGE_SENT, message => logger.info('Message to chatbot:', message))
    .on(WebhookEvent.MESSAGE_RECEIVED, message => logger.info('Message from chatbot:', message))

  // setup google action default intents
  assistant.intent('Default Fallback Intent', (conv) => {
    logger.info('Got query : ', conv.query);
    // async must have promise in here
    const promise = new Promise(function (resolve, reject) {
      //send message
    // TODO get userInfo
      const MessageModel = webhook.MessageModel();
      const message = {
        userId: 'anonymous',
        messagePayload: MessageModel.textConversationMessage(conv.query)
      };
      webhook.send(message);
      // wait for post callback
      webhook.on(WebhookEvent.MESSAGE_RECEIVED, message => {
        resolve(message);
      });
    })
      .then(function (result) {
        // TODO add multiple response types, this is only text
          conv.ask(result.messagePayload.text);
        })
    // return Promise
    return promise;
  })
  
  // Create endpoint for Oracle Chatbot webhook channel configurtion (Outgoing URI)
  app.post('/bot/message', webhook.receiver());

  // Webhook for google with use the google parser and assistant 
  app.use('/bot/action',bodyParser.json(),assistant);
  app.post('/bot/action', assistant );
}

import { feathers } from '@feathersjs/feathers'
import { koa, rest, bodyParser, errorHandler, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { MessageService } from './message.service.js'

// This tells TypeScript what services we are registering
type ServiceTypes = {
  messages: MessageService
}

// Creates an KoaJS compatible Feathers application
const app = koa<ServiceTypes>(feathers())

// Host static files from `public/` only, so source and config files are not served
app.use(serveStatic('public'))
// Register the error handle
app.use(errorHandler())
// Parse JSON request bodies
app.use(bodyParser())

// Register REST service handler
app.configure(rest())
// Configure Socket.io real-time APIs
app.configure(socketio())
// Register our messages service
app.use('messages', new MessageService())

// Add any new real-time connection to the `everybody` channel
app.on('connection', (connection) => app.channel('everybody').join(connection))
// Publish all events to the `everybody` channel
app.publish((_data) => app.channel('everybody'))

// Start the server (override the port with the PORT environment variable)
const port = Number(process.env.PORT ?? 3030)

app
  .listen(port)
  .then(() => console.log(`Feathers server listening on localhost:${port}`))

// For good measure let's create a message
// So our API doesn't look so empty


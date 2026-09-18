import { feathers } from '@feathersjs/feathers'
import { MessageService, type Message } from './message.service.js'

// This tells TypeScript what services we are registering
type ServiceTypes = {
  messages: MessageService
}

const app = feathers<ServiceTypes>()

// Register the message service on the Feathers application
app.use('messages', new MessageService())

// Log every time a new message has been created
app.service('messages').on('created', (message: Message) => {
  console.log('A new message has been created', message)
})


const main = async () => {
  await app.service('messages').create({
    text: 'Hello Feathers'
  })

  // And another one
  await app.service('messages').create({
    text: 'Hello again'
  })

  await app.service('messages').update(0, { text: 'Updated message' })
  await app.service('messages').remove(1)   

  // Find all existing messages
  const messages = await app.service('messages').find()

  console.log('All messages', messages)
}

main()
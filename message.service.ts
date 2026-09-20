import type { Id } from '@feathersjs/feathers'
import { NotFound } from '@feathersjs/errors'

// This is the interface for the message data
export interface Message {
  id?: number
  text: string
  createdAt: Date
}

export class MessageService {
  messages: Message[] = []
  // Ever-increasing counter so ids are never reused after a message is removed
  private nextId = 0

  async find() {
    // Just return all our messages
    return this.messages
  }

  // Ids arrive as strings over REST (e.g. `/messages/1`), so compare numerically
  async get(id: Id) {
    const message = this.messages.find(message => message.id === Number(id))
    if (!message) {
      throw new NotFound(`No message found for id '${id}'`)
    }
    return message
  }

  async update(id: Id, data: Partial<Pick<Message, 'text'>>) {
    const message = await this.get(id)
    if (data.text !== undefined) {
      message.text = data.text
    }
    return message
  }

  async remove(id: Id) {
    const message = await this.get(id)
    this.messages.splice(this.messages.indexOf(message), 1)
    return message
  }

  async create(data: Pick<Message, 'text'>) {
    const message: Message = {
      id: this.nextId++,
      text: data.text,
      createdAt: new Date(),
    }

    // Add new message to the list
    this.messages.push(message)

    return message
  }
}

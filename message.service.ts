// This is the interface for the message data
export interface Message {
  id?: number
  text: string
  createdAt: Date
}

export class MessageService {
  messages: Message[] = []

  async find() {
    // Just return all our messages
    return this.messages
  }

  async get(id: number) {
    return this.messages.find(message => message.id === id)
  }

  async update(id: number, data: Partial<Pick<Message, 'text'>>) {
    const message = await this.get(id)
    if (!message) {
      return null
    }
    if (data.text !== undefined) {
      message.text = data.text
    }
    return message
  }

  async remove(id: number) {
    const index = this.messages.findIndex(message => message.id === id)
    if (index === -1) {
      return null
    }
    const [removedMessage] = this.messages.splice(index, 1)
    return removedMessage
  }

  async create(data: Pick<Message, 'text'>) {
    const message: Message = {
      id: this.messages.length,
      text: data.text,
      createdAt: new Date(),
    }

    // Add new message to the list
    this.messages.push(message)

    return message
  }
}

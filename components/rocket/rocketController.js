import { driver, api } from '@rocket.chat/sdk'
import { getOr } from 'lodash/fp'
import service from './rocketService'
import errors from '../errors'
import logs from '../logs'
import commands from '../commands'
import settings from '../settings'
import interactions from '../interactions'

const file = 'Rocket | Controller'
let BOT_ID

const exec = async () => {
  BOT_ID = await service.runBot(handle)
  await service.runAPI()
}

const handle = async (error, message, messageOptions) => {
  if (error) {
    errors._throw(file, 'handle', error)
    return
  }

  try {
    if (!service.isValidMessage(BOT_ID, message, messageOptions)) return

    const data = {
      origin: 'rocket',
      ...message,
      ...messageOptions
    }

    logs.info('MESSAGE: ', data)

    await interactions.handle(data)
    if (!message.reactions && !message.replies) await commands.handle(message)
  } catch (e) {
    console.log('error ----->> ', e)
    const data = new Date(message.ts['$date']).toLocaleDateString('en-US')
    const text = `${e.message} - ${message.u.name} (${message.u._id}) - ${data}`
    errors._throw(file, 'handle', text)
  }
}

const getUserInfo = async userId => {
  try {
    const result = await api.get('users.info', { userId: userId })
    return getOr(false, 'user', result)
  } catch (e) {
    errors._throw(file, 'getUserInfo', e)
    return false
  }
}

const getUserInfoByUsername = async username => {
  try {
    const result = await api.get('users.info', { username: username })
    return getOr(false, 'user', result)
  } catch (e) {
    errors._throw(file, 'getUserInfoByUsername', e)
    return false
  }
}

const getHistory = async roomId => {
  try {
    const result = await api.get('channels.history', {
      roomId: roomId,
      count: 8000
    })

    return result.messages
  } catch (e) {
    errors._throw(file, 'getHistory', e)
  }
  return false
}

const getChannels = async () => {
  try {
    const result = await api.get('channels.list', { count: 400 })
    return result.channels
  } catch (e) {
    errors._throw(file, 'getChannels', e)
    return false
  }
}

const sendMessageToRoom = (message, room) => {
  try {
    return driver.sendToRoom(message, room)
  } catch (e) {
    errors._throw(file, 'sendMessageToRoom', e)
  }
}

const sendMessageToUser = (message, user) => {
  try {
    return driver.sendDirectToUser(message, user)
  } catch (e) {
    errors._throw(file, 'sendMessageToUser', e)
  }
}

const normalize = data => {
  return service.convertToInteraction(data)
}

const getDailyLimit = async () => {
  return settings.getValue('rocket_daily_limit')
}

const findOrCreateUser = async interaction => {
  const rocketUser = await getUserInfo(interaction.rocketId)
  return await service.findOrCreateUser(rocketUser)
}

const isFlood = interaction => {
  return service.isFlood(interaction)
}

export default {
  sendMessageToUser,
  sendMessageToRoom,
  getUserInfo,
  getUserInfoByUsername,
  getHistory,
  getChannels,
  findOrCreateUser,
  normalize,
  getDailyLimit,
  isFlood,
  exec
}

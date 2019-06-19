import dal from './achievementsTemporaryDAL'
import utils from './achievementsTemporaryUtils'
import achievementsService from '../achievements/achievementsService'
import users from '../users'
import interactions from '../interactions'

const getMessages = async userId => {
  const achievementsTemporary = await dal.findAllByUser(userId)
  return utils.generateMessages(achievementsTemporary)
}

const resetAllEarned = achievement => {
  achievement.ratings = achievement.ratings.map(rating => {
    rating.ranges = rating.ranges.map(range => {
      return {
        name: range.name,
        value: range.value
      }
    })

    rating.total = 0
    return rating
  })

  achievement.total = 0
  return achievement
}

const findOrCreate = async (data, user) => {
  let achievement = await dal.findOne({
    temporaryData: data._id,
    user: user._id
  })

  if (!achievement && utils.isBeforeLimitDate(data)) {
    achievement = await create(data, user)
  }

  return achievement
}

const create = async (temporaryData, user) => {
  let achievement = utils.convertDataToAchievement(temporaryData, user._id)
  return dal.save(achievement)
}

const update = async (achievement, user, interaction) => {
  if (!utils.isInDeadline(achievement)) return achievement
  achievement.ratings = utils.setEarned(achievement.ratings)
  achievement.total += 1
  achievement.lastEarnedDate = Date.now
  achievement.record = utils.getRecord(achievement)
  await addScore(user, achievement, interaction)
  return dal.save(achievement)
}

const addScore = async (user, achievement, interaction) => {
  const score = utils.calculateScoreToIncrease(achievement.ratings)

  if (score > 0) {
    await users.updateScore(user, score)
    await saveScoreInteraction(user, achievement, score, 'Conquista Temporária')
  }

  if (score > 0 || achievement.total === 1) {
    await sendEarnedMessage(user, achievement, interaction)
  }
}

const saveScoreInteraction = async (user, achievement, score, text) => {
  return interactions.saveManual({
    user: user._id,
    rocketUsername: user.username,
    score: score,
    value: achievement._id,
    text: text
  })
}

const sendEarnedMessage = (user, achievement, interaction) => {
  const current = {
    name: achievement.name,
    rating: achievement.record.name,
    range: achievement.record.range
  }

  achievementsService.sendEarnedMessage(user, current, interaction)
}

export default {
  getMessages,
  resetAllEarned,
  findOrCreate,
  create,
  update
}

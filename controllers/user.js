import config from "config-yml";
import mongoose from "mongoose";
import {
  calculateScore,
  calculateReceivedScore,
  calculateLevel,
  getUserInfo,
  isCoreTeam
} from "../utils";
import { sendHelloOnSlack } from "../utils/bot";
import { _throw } from "../helpers";

export const updateParentUser = async interaction => {
  const UserModel = mongoose.model("User");
  const user = await getAndUpdateUser(interaction, true);
  const instance = new UserModel(user);
  return instance.save();
};

export const update = async interaction => {
  const UserModel = mongoose.model("User");
  const user = await getAndUpdateUser(interaction);
  switch (interaction.type) {
    case "message":
      user.messages++;
      break;
    case "thread":
      user.replies++;
      break;
    case "reaction_added":
      user.reactions_info[0].send = user.reactions_info[0].send
        ? user.reactions_info[0].send + 1
        : 1;
      break;
  }
  console.log("chega aqui???????", user);

  const instance = new UserModel(user);
  return instance.save();
};

export const find = async (userId, isCoreTeam) => {
  const UserModel = mongoose.model("User");
  const result = await UserModel.findOne({
    slackId: userId,
    isCoreTeam: isCoreTeam || false
  }).exec();
  result.score = parseInt(result.score);

  return result || _throw("Error finding a specific user");
};

export const findAll = async (isCoreTeam, limit) => {
  const UserModel = mongoose.model("User");
  const result = await UserModel.find({
    score: { $gt: 0 },
    isCoreTeam: isCoreTeam || false
  })
    .sort({
      score: -1
    })
    .limit(limit || 20)
    .exec();
  result.map(user => {
    user.score = parseInt(user.score);
  });

  return result || _throw("Error finding all users");
};

export const rankingPosition = async (isCoreTeam, userId) => {
  const allUsers = await findAll(isCoreTeam);
  const position = allUsers.map(e => e.slackId).indexOf(userId) + 1;

  return position;
};

export const checkCoreTeam = async () => {
  const UserModel = mongoose.model("User");
  const UsersBulk = UserModel.bulkWrite([
    {
      updateMany: {
        filter: { isCoreTeam: undefined },
        update: { isCoreTeam: false },
        upsert: { upsert: false }
      }
    },
    {
      updateMany: {
        filter: { slackId: { $in: config.coreteam.members } },
        update: { isCoreTeam: true },
        upsert: { upsert: false }
      }
    }
  ]);

  return UsersBulk;
};

const getAndUpdateUser = async (interaction, isParentuser = false) => {
  const UserModel = mongoose.model("User");
  const theUser = isParentuser ? interaction.parentUser : interaction.user;
  const user = await UserModel.findOne({ slackId: theUser });
  if (user) {
    user.score += isParentuser ? calculateReceivedScore(interaction) : calculateScore(interaction);
    user.level = calculateLevel(user.score);
    user.isCoreTeam = isCoreTeam(interaction.user);
    return user;
  } else {
    getUserInfo(theUser).then(userInfo => {
      const newUser = {
        avatar: userInfo.profile.image_72,
        name: userInfo.profile.real_name,
        level: 1,
        score: isParentuser ? calculateReceivedScore(interaction) : calculateScore(interaction),
        slackId: theUser,
        messages: interaction.type === "message" ? 1 : 0,
        replies: interaction.type === "thread" ? 1 : 0,
        reactions: interaction.type === "reaction_added" ? 1 : 0,
        lastUpdate: new Date(),
        isCoreTeam: isCoreTeam(theUser)
      };
      sendHelloOnSlack(theUser);
      return newUser;
    });
  }
};

export default {
  find,
  findAll,
  update,
  updateParentUser,
  rankingPosition,
  checkCoreTeam
};

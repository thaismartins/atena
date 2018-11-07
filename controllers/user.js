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
  const score = calculateReceivedScore(interaction);
  const userInfo = await getUserInfo(interaction.parentUser);

  if (userInfo.ok) {
    const UserModel = mongoose.model("User");
    const user = await UserModel.findOne({
      slackId: interaction.parentUser
    }).exec();

    if (user) {
      return UserModel.findOne(
        { slackId: interaction.parentUser },
        (err, doc) => {
          if (err) {
            throw new Error("Error updating parentUser");
          }
          const newScore = doc.score + score;
          doc.level = calculateLevel(newScore);
          doc.score = newScore < 0 ? 0 : newScore;
          doc.save();
          return doc;
        }
      );
    } else {
      throw new Error(`Error: parentUser does not exist `);
    }
  } else {
    throw new Error(`Error: ${userInfo.error}`);
  }
};

export const update = async interaction => {
  const score = calculateScore(interaction);
  const UserModel = mongoose.model("User");
  const user = await UserModel.findOne({ slackId: interaction.user });

  if (user) {
    user.score += score;
    user.level = calculateLevel(user.score);
    user.isCoreTeam = isCoreTeam(interaction.user);
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
    const instance = new UserModel(user);
    return instance.save();
  } else {
    getUserInfo(interaction.user).then(userInfo => {
      const newUser = {
        avatar: userInfo.profile.image_72,
        name: userInfo.profile.real_name,
        level: 1,
        score: score,
        slackId: interaction.user,
        messages: interaction.type === "message" ? 1 : 0,
        replies: interaction.type === "thread" ? 1 : 0,
        reactions: interaction.type === "reaction_added" ? 1 : 0,
        lastUpdate: new Date(),
        isCoreTeam: isCoreTeam(interaction.user)
      };
      const instance = new UserModel(newUser);
      sendHelloOnSlack(interaction.user);
      return instance.save();
    });
  }
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

export default {
  find,
  findAll,
  update,
  updateParentUser,
  rankingPosition,
  checkCoreTeam
};

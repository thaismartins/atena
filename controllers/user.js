import config from "config-yml";
import mongoose from "mongoose";
import {
  calculateScore,
  calculateReceivedScore,
  calculateReactions,
  calculateLevel,
  getUserInfo,
  isCoreTeam
} from "../utils";
import { sendToUser } from "../rocket/bot";
import { _throw } from "../helpers";
import { doLevelChangeActions } from "../utils/levels";

const updateParentUser = async interaction => {
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
          const newLevel = calculateLevel(newScore);

          doLevelChangeActions(doc._id, doc.level, newLevel);

          doc.level = newLevel;
          doc.score = newScore < 0 ? 0 : newScore;
          doc.lastUpdate = Date.now();
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

const update = async interaction => {
  const score = calculateScore(interaction);
  const UserModel = mongoose.model("User");
  let user = {};
  let userInfo;

  if (interaction.origin === "slack" || !interaction.origin) {
    userInfo = await getUserInfo(interaction.user);
    user = await UserModel.findOne({ slackId: interaction.user }).exec();
  } else if (interaction.origin === "rocket") {
    userInfo = false;
    user = await UserModel.findOne({ rocketId: interaction.user }).exec();
  }

  if (user) {
    return updateUserData(UserModel, interaction, score);
  } else {
    return createUserData(userInfo, score, interaction, UserModel);
  }
};

const find = async (userId, isCoreTeam = false, selectOptions = "-email") => {
  const UserModel = mongoose.model("User");
  const result = await UserModel.findOne({
    slackId: userId,
    isCoreTeam: isCoreTeam
  })
    .select(selectOptions)
    .exec();
  if (result) result.score = result.score.toFixed(0);

  return result || _throw("Error finding a specific user");
};

const findByOrigin = async (interaction, isParent = false) => {
  let query = {};
  let userId = isParent ? interaction.parentUser : interaction.user;

  if (interaction.origin != "sistema") {
    query[`${interaction.origin}Id`] = userId;
  } else {
    query = { _id: userId };
  }

  const UserModel = mongoose.model("User");
  const user = await UserModel.findOne(query).exec();

  if (user) user.network = interaction.origin;

  return user;
};

const findBy = async args => {
  const UserModel = mongoose.model("User");
  const result = await UserModel.findOne(args).exec();
  return result || _throw("Error finding user");
};

const findAll = async (
  isCoreTeam = false,
  limit = 20,
  selectOptions = "-email -teams -_id -lastUpdate",
  team = null
) => {
  const UserModel = mongoose.model("User");
  const base_query = {
    score: { $gt: 0 },
    isCoreTeam: isCoreTeam,
    teams: team
  };

  const result = await UserModel.find(base_query)
    .sort({
      score: -1
    })
    .limit(limit)
    .select(selectOptions)
    .exec();
  result.map(user => {
    user.score = parseInt(user.score);
  });

  return result || _throw("Error finding all users");
};

const rankingPosition = async (userId, isCoreTeam = false) => {
  const allUsers = await findAll(isCoreTeam);
  const user = await getNetwork(userId);
  const position = (await allUsers.map(e => e.id).indexOf(user.id)) + 1;

  return position;
};

const checkCoreTeam = async () => {
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

const findInactivities = async () => {
  const UserModel = mongoose.model("User");
  const today = new Date();
  const dateRange = today.setDate(
    today.getDate() - config.xprules.inactive.mindays
  );
  const result = await UserModel.find({
    lastUpdate: { $lt: dateRange }
  })
    .sort({
      score: -1
    })
    .exec();

  return result || _throw("Error finding inactivity users");
};

const createUserData = async (userInfo, score, interaction, UserModel) => {
  let obj = {};
  const level = 1;

  if (userInfo) {
    obj = {
      avatar: userInfo.profile.image_72,
      name: userInfo.profile.real_name,
      email: userInfo.profile.email,
      level: level,
      score: score,
      slackId: interaction.user,
      messages: interaction.type === "message" ? 1 : 0,
      replies: interaction.type === "thread" ? 1 : 0,
      reactions: calculateReactions(interaction, 0),
      lastUpdate: new Date(),
      isCoreTeam: isCoreTeam(interaction.user)
    };
  } else {
    obj = {
      name: interaction.username,
      level: level,
      score: score,
      rocketId: interaction.user,
      messages: interaction.type === "message" ? 1 : 0,
      replies: interaction.type === "thread" ? 1 : 0,
      reactions: calculateReactions(interaction, 0),
      lastUpdate: new Date(),
      isCoreTeam: isCoreTeam(interaction.user)
    };
  }

  sendToUser(
    `Olá, Impulser! Eu sou *Atena*, deusa da sabedoria e guardiã deste reino! Se chegaste até aqui suponho que queiras juntar-se a nós, estou certa?! Vejo que tens potencial, mas terás que me provar que és capaz!
    \n\n
    Em meus domínios terás que realizar tarefas para mim, teus feitos irão render-te *Pontos de Experiência* que, além de fortalecer-te, permitirão que obtenhas medalhas de *Conquistas* em forma de reconhecimento! Sou uma deusa amorosa, por isso saibas que, eventualmente, irei premiar-te de maneira especial!
    \n\n
    No decorrer do tempo, sentirás a necessidade de acompanhar o teu progresso. Por isso, podes consultar os livros de nossa biblioteca que contém tudo o que fizestes até então, são eles:
    \n
    - Pergaminhos de *Pontos de Experiência: !meuspontos* ou */meuspontos*;
    \n
    - e os Tomos de *Conquistas: !minhasconquistas* ou */minhasconquistas*.
    \n\n
    Ah! Claro que não estás só na realização destas tarefas. Os nomes dos(as) Impulsers estão dispostos nos murais no exterior de meu templo, esta é uma forma de reconhecer o teu valor e os teusesforços. Lá, tu encontrarás dois murais:
    \n
    - O *!ranking* ou */ranking _nº do mês_* onde estão os nomes dos(das) que mais se esforçaram neste mês. Aquele(a) que estiver em primeiro lugar receberá uma recompensa especial;
    \n
    - e o *!rakinggeral* ou */rankinggeral* onde os nomes ficam dispostos, indicando -toda a sua contribuição realizada até o presente momento.
    \n
    Sei que são muitas informações, mas tome nota, para que não te esqueças de nada. Neste papiro, encontrarás *tudo o que precisa* saber em caso de dúvidas: **http://atena.impulso.network.**
    \n\n
    Espero que aproveite ao máximo *tua jornada* por aqui!`,
    interaction.rocketUsername
  );

  const instance = new UserModel(obj);
  const user = await instance.save();

  await doLevelChangeActions(user._id, 0, level);

  return user;
};

const updateUserData = (UserModel, interaction, score) => {
  if (interaction.origin === "rocket") {
    return UserModel.findOne(
      {
        rocketId: interaction.user
      },
      (err, doc) => {
        if (err) _throw("Error updating user");

        const newScore = doc.score + score;
        const newLevel = calculateLevel(newScore);

        doLevelChangeActions(doc._id, doc.level, newLevel);

        doc.level = newLevel;
        doc.score = newScore < 0 ? 0 : newScore;
        doc.isCoreTeam = isCoreTeam(interaction.user);
        doc.messages =
          interaction.type === "message" ? doc.messages + 1 : doc.messages;
        doc.replies =
          interaction.type === "thread" ? doc.replies + 1 : doc.replies;
        doc.reactions = calculateReactions(interaction, doc.reactions);
        doc.lastUpdate = Date.now();
        doc.save();
        return doc;
      }
    );
  } else {
    return UserModel.findOne({ slackId: interaction.user }, (err, doc) => {
      if (err) {
        throw new Error("Error updating user");
      }

      const newScore = doc.score + score;
      const newLevel = calculateLevel(newScore);

      doLevelChangeActions(doc._id, doc.level, newLevel);

      doc.level = newLevel;
      doc.score = newScore < 0 ? 0 : newScore;
      doc.isCoreTeam = isCoreTeam(interaction.user);
      doc.messages =
        interaction.type === "message" ? doc.messages + 1 : doc.messages;
      doc.replies =
        interaction.type === "thread" ? doc.replies + 1 : doc.replies;
      doc.reactions = calculateReactions(interaction, doc.reactions);
      doc.lastUpdate = Date.now();
      doc.save();
      return doc;
    });
  }
};

const getNetwork = async user_id => {
  let user = {};
  const UserModel = mongoose.model("User");
  const slack_user = await UserModel.findOne({ slackId: user_id });
  const rocket_user = await UserModel.findOne({ rocketId: user_id });
  if (slack_user) {
    user = slack_user;
    user.network = "slack";
  } else if (rocket_user) {
    user = rocket_user;
    user.network = "rocket";
  }

  return user;
};

const changeTeams = async (userId, teams) => {
  const UserModel = mongoose.model("User");
  const user = await getNetwork(userId);

  let result = {};
  try {
    result = await UserModel.findByIdAndUpdate(
      user._id,
      {
        teams: teams.split(",") || ""
      },
      (err, doc) => {
        if (err) return false;
        console.log(doc);

        return doc;
      }
    );
  } catch (e) {
    return false;
  }

  return result;
};

export default {
  find,
  findAll,
  update,
  updateParentUser,
  rankingPosition,
  checkCoreTeam,
  findInactivities,
  findBy,
  findByOrigin,
  getNetwork,
  changeTeams
};

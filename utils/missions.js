import moment from "moment-timezone";
import config from "config-yml";

import MissionModel from "../models/mission";
const ROCKET_BOT_USER = process.env.ROCKET_BOT_USER || "atena";

export const sendedToAnotherUser = data => {
  if (!isValidSendedMessage(data)) return false;
  const sendedUser = getRocketSender(data);
  return !!sendedUser.username && sendedUser.username != data.u.user;
};

export const getRocketSender = data => {
  if (!isValidSendedMessage(data)) return false;
  const sendedUsername = getUsernameByMessage(data.msg);
  if (
    data.mentions[0].username == data.u.username ||
    sendedUsername != data.mentions[0].username
  )
    return false;
  return data.mentions[0];
};

export const generateLimitDate = () => {
  return moment(Date.Now)
    .endOf("day")
    .utc()
    .add(config.missions.quiz.limit.date, "days")
    .toISOString();
};

export const isAcceptedAnswer = data => {
  return data.reaction && data.reaction === "accepted";
};

export const isRefusedAnswer = data => {
  return data.reaction && data.reaction === "refused";
};

export const isInLimitDate = date => {
  const today = moment(new Date())
    .utc()
    .format();
  return moment(new Date(date)).isSameOrAfter(today);
};

export const isInDailyLimit = async user => {
  let missions = await MissionModel.find({
    user: user,
    accepted: true,
    acceptedDate: { $exists: true, $not: { $type: 10 } },
    completed: false
  });

  return missions.length < config.missions.quiz.limit.simultaneously;
};

export const userAbleToReceiveNewMission = async user => {
  let missions = await MissionModel.find({
    user: user,
    completed: false,
    refuseDate: { $exists: false }
  });

  return missions.length < config.missions.quiz.limit.simultaneously;
};

export const userAbleToCompletedMission = async user => {
  const start = moment().startOf("day");
  const end = moment(start).endOf("day");

  const missionsCompletedToday = await MissionModel.find({
    user: user,
    accepted: true,
    completedDate: { $gte: start, $lte: end },
    completed: true
  });

  return missionsCompletedToday.length < config.missions.quiz.limit.daily;
};

export const generateMessage = (missionId, user) => {
  let optionsText = "";
  let reactions = {};

  const options = [
    {
      value: ":+1:",
      label: "Aceitar"
    },
    {
      value: ":-1:",
      label: "Recusar"
    }
  ];

  options.forEach(option => {
    optionsText += ` ${option.value} ${option.label} \n\n`;
    reactions[`${option.value}`] = {
      usernames: [ROCKET_BOT_USER]
    };
  });

  const sender = user ? ` de @${user}` : "";
  return {
    msg: `*Nobre guerreiro(a), você acabou de receber uma nova missão${sender}!* \n\n ${optionsText} \n **Responda clicando em uma das opções a seguir:**`,
    researchHash: missionId, // TODO: encrypt
    reactions
  };
};

export const convertToMissionData = message => {
  if (!isMissionAnswer(message)) {
    return;
  }

  let data = {
    researchHash: message.researchHash,
    reaction: null
  };

  let positive = message.reactions[":+1:"].usernames;
  let negative = message.reactions[":-1:"].usernames;

  positive = positive.filter(user => user !== ROCKET_BOT_USER);
  negative = negative.filter(user => user !== ROCKET_BOT_USER);

  if (positive.length) {
    data.reaction = "accepted";
  } else if (negative.length) {
    data.reaction = "refused";
  }

  return data;
};

export const isMissionAnswer = message => {
  return (
    message.reactions &&
    (message.reactions[":+1:"] || message.reactions[":-1:"]) &&
    message.u.username === ROCKET_BOT_USER &&
    Object.keys(message.reactions).length &&
    message.researchHash
  );
};

const isValidSendedMessage = data => {
  return (
    data.msg.includes("@") &&
    getUsernameByMessage(data.msg).length > 0 &&
    data.mentions.length > 0 &&
    data.u &&
    data.u.username.length > 0
  );
};

const getUsernameByMessage = message => {
  return message
    .replace("!missao @", "")
    .split("@")[0]
    .trim();
};

import moment from "moment-timezone";
import config from "config-yml";

import MissionModel from "../models/mission";
import rocket from "../rocket/api";
import userController from "../controllers/user";

export const sendedToAnotherUser = (message, user) => {
  const sendedUser = getSenderUsername(message);
  return message.includes("@") && sendedUser !== user;
};

export const getSenderUsername = message => {
  return (
    message
      .replace(/.*@/, "")
      .replace("!missao", "")
      .trim() || false
  );
};

export const generateLimitDate = () => {
  return moment(Date.Now)
    .endOf("day")
    .utc()
    .add(config.missions.quiz.limit.date, "days")
    .toISOString();
};

export const isAcceptedAnswer = data => {
  return (
    data.description &&
    (data.description.includes(":+1:") ||
      data.description.includes(":thumbsup:"))
  );
};

export const isRefusedAnswer = data => {
  return (
    data.description &&
    (data.description.includes(":-1:") ||
      data.description.includes(":thumbsdown:"))
  );
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
    $or: [
      {
        user: user,
        accepted: true,
        acceptedDate: { $exists: true, $not: { $type: 10 } },
        completed: false
      },
      {
        user: user,
        accepted: false,
        completed: false,
        refuseDate: { $exists: false }
      }
    ]
  });

  return missions.length < config.missions.quiz.limit.simultaneously;
};

export const getReceiverByUsername = async username => {
  if (username) {
    const rocketUser = await rocket.getUserInfoByUsername(username);
    if (rocketUser) {
      return await userController.findByOrigin({
        origin: "rocket",
        user: rocketUser._id
      });
    }
  }

  return false;
};

export const generateMessage = missionId => {
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
      usernames: [process.ENV.ROCKET_BOT_USER]
    };
  });

  return {
    msg: `*Nobre guerreiro(a), você acabou de receber uma nova missão!* \n\n ${optionsText} \n **Responda clicando em uma das opções a seguir:**`,
    researchHash: missionId, // TODO: encrypt
    reactions
  };
};
